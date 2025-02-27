---
title: 스프링 트랜잭션 동기화와 추상화 (feat. TransactionManager)
date: "2024-12-30"
tags:
  - 데이터베이스
  - 트랜잭션
previewImage: spring.png
---

데이터베이스 레플리케이션을 구축할 때 `TransactionaSynchornizationManager` 를 사용하여 라우팅 환경을 구축한 경험이 있다. 이번 포스팅에선 트랜잭션 동기화와 추상화에 대해 다루어보고자 한다.

## JDBC 에서 트랜잭션 로직이 뒤섞이는 문제

데이터베이스에서 간단히 **SELECT, INSERT** 문을 날리면 데이터베이스 쿼리 결과가 실제로 반영된다. 사실 이를 가능케 하는것 **AUTO COMMIT** 기능이 활성화되었기 때문이다. **AUTO COMMIT** 이란 데이터베이스 내부적으로 커밋을 자동으로 수행하는 기능이다. 반대로 말해, **AUTO COMMIT** 이 꺼져있다면 커밋이 수행되지 않아서 데이터베이스에 쿼리가 반영되지 않는다.

보통 트랜잭션을 처리하면 최소 2개 이상의 여러 쿼리가 한 단위로 묶여서 수행된다. 그런데 만약 AUTO COMMIT 이 활성화되었다면 트랜잭션이 정상 수행될까? 트랜잭션은 ACID 원칙에 따라 원자성(atomic) 을 보장해야한다. 그런데 AUTO COMMIT 이 활성화된다면 단일 쿼리가 별개로 동작하고 커밋되어서 원자성을 갖지 못하게 된다. 따라서 JDBC 환경에선 **트랜잭션의 원자성을 보장하기 위해 AUTO COMMIT 기능을 비활성화하고, 우리가 직접 커밋과 롤백의 시점을 관리하고 구성**해야한다.

`Connection` 오브젝트는 `setAutoCommit()` 메소드를 통홰 AUTO COMMIT 의 활성화 여부를 설정할 수 있도록 해준다. 아래와 같이 여행지를 방문하는 상황을 가정해보자. 여기서 가장 중심적으로 살펴봐야 할 부분은 `Connection` 을 외부로부터 파라미터로 전달받는다는 점이다.

```java
@Repository
public class TripDao {
    // ...
    public Trip findTrip(final Connection connection, final int tripId) {
        String sql = "SELECT * FROM trip WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, tripId); // id에 해당하는 값을 매개변수로 설정
            ResultSet rs = pstmt.execteQuery();

            return new Trip(
                rs.getId("id"),
                rs.getString("place_name"),
                rs.getString("image_url"),
            );
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

이어서 여행지를 방문했다면 동시에 해당 여행지의 누적 방문 수를 1증가시키는 기능도 함께 동작하도록 해야한다.

```java
public void updateTrip(final Connection connection, final int tripId) {
    try {
        String sql = "update trip set visited_count = visited_count +1 where id = ?";
        PreparedStatement pstmt = connection.prepareStatement(sql);
        pstmt.setInt(1, tripId);
        pstmt.executeUpdate();
    } catch(SQLException e) {
        e.printStackTrace();
    }
}
```

앞서 설명했듯이 DAO 내부에서 직접 `Connection` 을 생성하는 것이 아니라 외부로부터 파라미터로 주입받아서 사용한다. 이렇게 구성한 이유는, 트랜잭션을 사용하기 위해선 트랜잭션을 구성하는 여러개의 쿼리가 동일한 커넥션에서 실행되어야하기 때문이다. 아래와 같이 애플리케이션 계층에서 여행지 조회 및 업데이트 쿼리가 동일한 `Connection` 에서 실행될 수 있어야지 트랜잭션 묶음으로 수행되었다고 할 수 있다. 또한 쿼리 실행전에 AUTO COMMIT 을 비활성화하였으며, 모든 쿼리 실행 후 커밋을 수행한 모습을 볼 수 있다.

```java
@Service
public TripService {
    private TripDao tripDao;

    public Trip findTrip(final int tripId) {
        Connection connection = null;

        try {
            connection = DrivierManager.getConnection();
            connection.setAutoCommit(false);

            Trip trip = tripDao.findTrip(connection, tripId);
            tripDao.updateTrip(connection, tripId);

            connection.commit();
        } catch(SQLException e) {
            connection.rollBack();
        } finally {
            try {
                connection.close();
            } catch(SQLException e) {
                // ...
            }
        }
    }
}
```

위 코드는 비즈니스 로직이 직관적으로 눈에 보이지 않는다. 위에서 사용되는 모든 쿼리를 동일한 `Connection` 에서 처리해야 하다보니, 불가피하게 `Connection` 이 애플리케이션 계층에 위치할 수 밖에 없다. 애플리케이션 계층의 주 관심사는 비즈니스 로직인데, 이 때문에 비즈니스 로직에 집중할 수가 없게 되었다. 또한 try-catch-finally 구조로 인해 가독성도 저하된다.

결국 커넥션을 생성하고, 트랜잭션 경계를 설정하는 코드가 애플리케이션 계층에 위치해있다보니 DAO 에서 본디 수행해야 할 데이터 엑세스 처리 관련 로직이 애플리케이션 계층에도 존재한다.

## 트랜잭션 동기화

`Connection` 을 파라미터로 넘겨서 공유하는 방식은 많은 단점을 안겨준다. 이를 해결하기 위해 `Connection` 을 계속 파라미처로 전달하는 코드를 재거해보자. 스프링에서는 **트랜잭션 동기화 매니저(Transaction Synchornization Manager)**을 통해 이를 가능케한다. 트랜잭션 동기화 매니저는 트랜잭션을 시작하기 위해 각 쓰레드마다 생성한 `Connection` 객체를 고유한 **쓰레드 로컬(Thread Local)** 에 저장하고, 필요할 때 마다 매번 쓰레드 풀에서 꺼내 쓰는 역할을 수행한다. 쓰레드 로컬 특성상 각 쓰레드별로 독립적인 `Connection` 을 보관할 수 있기 때문에 멀티 쓰레드 환경에서도 항상 동일한 커넥션 객체를 가져올 수 있게된다.

트랜잭션 동기화는 다음과 같은 과정을 통해 수행된다.

- `(1)` `@Transactional` 을 만나는 그 즉시 **트랜잭션 추상화 매니저(PlatformTransactionManager)** 가 `getConnection()` 을 호출하여 트랜잭션을 시작할 준비를 한다.

- `(2)` 이때, 트랜잭션을 시작하기 위해선 Connection이 필요하다. 따라서 트랜잭션 매니저는 내부에서 DataSource 를 사용해서 Connection 을 생성한다.

- `(3)` Connection 의 자동 커밋을 비활성화 해준다. 즉, **AUTO COMMIT** 옵션을 False 로 지정한 뒤에 이제부터 본격적으로 트랜잭션을 시작한다.

- `(4)` Connection 을 **트랜잭션 동기화 매니저(Transaction Synchornization Manager)** 에 보관한다.

- `(5)` 트랜잭션 동기화 매니저는 본인이 보유한 쓰레드 로컬에 커넥션을 저장한다. 앞으로 트랜잭션내의 비즈니스 로직을 수행하면서 커넥션이 필요할 때 마다 이 쓰레드 로컬에 저장한 커넥션을 꺼내어 올 것이다.

- `(6)` 비즈니스 로직을 수행하면서 커넥션이 필요할 때 마다 `DataSourceUtils` 의 `getConnection()` 을 호출하여 트랜잭션 동기화 매니저에 보관된 커넥션을 꺼내어 사용한다. 이로써 하나의 트랜잭션내에 담긴 모든 쿼리를 수행시 동일한 커넥션을 사용하게 된다.

- `(7)` 비즈니스 로직이 끝나고 트랜잭션을 커밋 또는 롤백할 때도 트랜잭션 매니저에서 커넥션을 꺼내와서 트랜잭션을 커밋 또는 롤백한다.

### 트랜잭션 동기화 적용

스프링에선 `TranscationSynchornizationManager` 라는 클래스를 사용해서 트랜잭션을 동기화한다. 이 클래스를 활용하여 앞선 코드를 개선해보자. 앞서 설명했듯이 커넥션을 생성하기 위해선 `DataSource` 가 필요하다. 이를 위해 `DataSource` 에 대한 기본 설정을 application.yml 에서 진행해주자.

[JDBC 에서 데이터베이스 커넥션 풀 다루기 (feat. JDBC Driver, DataSource, HikariCP)](https://haon.blog/database/jdbc-connection-pool/) 에서 다루었듯이, DataSource 는 자바 애플리케이션에서 데이터베이스 커넥션을 얻어오기 위해 사용하는 방법 중 하나이다. 각 서비스에서 사용하는 DB 벤터에 알맞게 DataSource 구현체(HikariCP, DriverManager 등) 이 자동 주입될 것이다.

```yml
spring:
  datasource:
    url: jdbc://mysql://localhost:3306/moheng
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
```

그리고 아래와 같이 `TransactionSynchornizationManager` 를 통해 트랜잭션 동기화 작업을 수행한다. 트랜잭션 동기화의 핵심은 어떤 계층, 어떤 곳에서든 동일한 트랜잭션이라면 항상 동일한 커넥션으로 쿼리를 수행하는 것이다. 실제로 `Connection` 을 일일이 메소드 파라미터로 넘겨주지 않더라도 같은 커넥션내에서 쿼리가 수행되도록 개선되었다.

```java
@Service
public TripService {
    private final DataSource dataSource;
    private final TripDao tripDao;

    // ...

    public Trip findTrip(final int tripId) {
        TransactionSynchornizationManager.initSynchornization(); // 트랜잭션 동기화 초기화

        Connection connection = DataSourceUtils.getConnection(dataSource); // 트랜잭션 동기화 매니저에 생성된 커넥션 가져오기

        try {
            connection.setAutoCommit(false);

            Trip trip = tripDao.findTrip(tripId);
            tripDao.updateTrip(tripId);

            connection.commit();
        } catch(SQLException e) {
            connection.rollBack();
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource); // 커넥션 해제
        }
    }
}
```

개선 결과, Dao 가 아래처럼 외부로부터 파라미터를 통해 `Connection` 을 전달받지 않는다. 그 대신 `DataSourceUtils` 를 사용하여 커넥션을 꺼내오도록 개선되었다.

```java
@Repository
public class TripDao {
    private final DataSource dataSource;
    // ...

    public Trip findTrip(final int tripId) {
        Connection connection = DataSourceUtils.getConnection(dataSource);

        String sql = "SELECT * FROM trip WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, tripId); /
            ResultSet rs = pstmt.execteQuery();

            return new Trip(
                rs.getId("id"),
                rs.getString("place_name"),
                rs.getString("image_url"),
            );
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public void updateTrip(final int tripId) {
        Connection connection = DataSourceUtils.getConnection(dataSource);

        try {
            String sql = "update trip set visited_count = visited_count +1 where id = ?";
            PreparedStatement pstmt = connection.prepareStatement(sql);
            pstmt.setInt(1, tripId);
            pstmt.executeUpdate();
        } catch(SQLException e) {
            e.printStackTrace();
        }
    }
}
```

이렇게 `TransactionSynchorizationManager` 를 통해 커넥션을 일일이 메소드 파라미터로 전달하는 코드가 제거되었다. 그런데, 아직까진 애플리케이션 계층이 다소 지저분하다는 느낌을 받지 않는가? 아직 TripService 코드에는 커넥션을 통해 직접적으로 트랜잭션 경계를 설정하는 코드가 남아있다.

## 트랜잭션 추상화

애플리케이션 계층내에 트랜잭션 경계를 직접 설정하는 코드를 제거하고 싶다는 생각이 든다. 이를위해, 스프링에서는 **트랜잭션 추상화(Transaction Abstraction)** 방법을 제공하고 있다. 트랜잭션 추상화란 트랜잭션 경계를 지정하는 과정을 추상화한 방법으로, 트랜잭션 추상화 관리자로 `PlatformTransactionManager` 를 제공한다. 이를 사용하여 트랜잭션 경계를 지정하는 로직을 간편히 구성할 수 있다.

```java
public interface PlatformTransactionManager extends TransactionManger {
    TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransacionException;
    void commit(TransactionStatus status) throws TransactionException;
    void rollback(TransactionStatus status) throws TransactionException;
}
```

`PlatformTransactionManger` 는 위와 같은 3가지 메소드를 제공하고 있다. 유추할 수 있듯이, 커밋과 롤백되는 시점을 지정할 수 있는 방법을 간편하게 추상화하였다. 이때 `TransactionStatus` 는 현재 트랜잭션의 ID와 구분 정보를 담고있는 객체이다.

트랜잭션 추상화 매니저인 `PlatformTransactionManger` 는 인터페이스이다. 이의 구현 클래스로 `DataSourceTransactionManager`, `JpaTransactionManager`, `HibernateTransactionManager` 등 많은 구현체가 존재한다. 우리는 `PlatformTransactionManger` 을 통해 JPA, JDBC, Hibernate, Jta, ... 등 기술 스택이 변경되는 상황에서도 유연하게 대응할 수 있다.

만약 앞선 트랜잭션 동기화 코드를 트랜잭션 추상화를 적용하여 개선한다면 어떻게될까? `PlatformTransactionManger` 구현체 중 하나인 `DataSourceTransactionManager` 를 사용하여 코드를 개선해보자.

```java
@Service
public TripService {
    private final DataSource dataSource;
    private final TripDao tripDao;

    // ...

    public Trip findTrip(final int tripId) {
        PlatformTransactionManager transactionManager = new DataSourceTransactionManger(dataSource);
        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());

        try {

            Trip trip = tripDao.findTrip(tripId);
            tripDao.updateTrip(tripId);

            transactionManager.commit();
        } catch(RuntimeException e) {
            transactionManager.rollBack(status);
        }
    }
}
```

어떤가? 훨씬 간편해지지 않았는가? 커넥션을 쓰레드 로컬에서 직접 꺼내오는 로직이 없어졌고, 커넥션을 코드상에서 직접 조작하지 않을 수 있게 되었다. 앞선 코드에서는 커넥션을 꺼내와서 트랜잭션 경계를 장황하게 설정해야 했지만, 이 코드가 더 깔끔히 개선되었다. 또한 트랜잭션 동기화를 위한 코드도 제거되었다. 이를통해 `PlatformTransactionManager` 는 트랜잭션 동기화 로직도 추상화함을 알 수 있다.

`TransactionStatus` 는 트랜잭션의 4가지 속성 (트랜잭션 전파, 격리 수준, 타임아웃, 읽기/쓰기 전용 여부) 의 상태값을 담고있는 인터페이스이다. 이 구현체로 `DefaultTransactionDefinition` 를 사용했다.

### AOP 를 이용한 선언전 트랜잭션

사실 `PlatformTransactionManager` 를 우리가 평소에 직접 사용할 일은 거의 없다. 그렇다면 우리는 어떠한 방식으로 트랜잭션 추상화를 누리고 있던것일까? 이 비밀은 바로 `@Transactional` 어노테이션에 있다.

`@Transactional` 은 AOP 를 통한 트랜잭션 경계 어노테이션이다. 우리는 이 어노테이션을 사용하면서 내부적으로 `PlatformTransactionManager` 의 기능, 즉 트랜잭션 추상화의 기능을 제공받고 있었던 것이다.

## AbstractRoutingDataSource 에서 동적으로 DataSource 를 결정하는 원리

이렇게까지 트랜잭션 동기화와 추상화에 대해 학습해보았다. 이번 포스팅의 가장 큰 목적은 트랜잭션 동기화 매니저에 대해 학습하는 것 이었다. 이 트랜잭션 동기화 매니저는 아래와 같이 [데이터베이스 레플리케이션 환경을 구축](https://haon.blog/database/replication-mysql-springboot/)할 때 `AbstractRoutingDataSource` 에서 사용했다.

```java
//  AbstractRoutingDataSource : Multi DataSource 환경에서 여러 DataSource 를 묶고 분기해줄 때 사용한다.
public class RoutingDataSource extends AbstractRoutingDataSource {
    // determineCurrentLookupKey 메소드 : 여러 datasource 중에서 실제로 사용될 DataSource 를 결정하는 역할
    // 현재 트랜잭션의 속성에 따라 targetDataSourceMap 의 조회 Key 를 결정하기위해 AbstractRoutingDataSource 를 상속받아서 determineCurrentLookupKey 를 구현했다.
    @Override
    protected Object determineCurrentLookupKey() {
        boolean isReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
        logger.info("현재 트랜잭션 속성이 ReadOnly인가?:" + isReadOnly);
        return isReadOnly ? "slave" : "master";
    }
}
```

`AbstractRoutingDataSource` 구현체는 `DataSource` 인터페이스의 구현체로, 동적인 DataSource 를 뜻한다. `AbstractRoutingDataSource` 는 어떻게 동적인 DataSource 를 결정할 수 있는것일까?

- `(1)` ` @Transactional` 를 마주한 시점부터 트랜잭션이 시작된다. 트랜잭션 추상화 매니저(PlatformTransactionManger) 가 `getConnection()` 을 호출하면서, 내부적으로 `DataSource` 를 사용하여 커넥션을 생성할 준비를 한다. 또한, 이때 현재 트랜잭션의 4가지 속성도 분석하여 `TransactionStatus` 형태로 트랜잭션 동기화 매니저 (쓰레드 로컬) 에 저장한다.

- `(2)` 커넥션을 생성하기 위해선 DataSource 정보가 필요할 것이다. 이때, 만약 AbstractRoutingDataSource 를 별도로 설정해놓았다면, AbstractRoutingDataSource 가 동적으로 트랜잭션 속성에 따라 적절한 DataSource 정보를 제공하게 된다.

- `(3)` 이에따라 RoutingDataSource 의 `determineCurrentLookupKey()` 메소드를 호출하게 된다. 이 메소드는 트랜잭션의 읽기 전용 여부를 확인하고 어떤 DataSource 를 제공할지 선택하는 역할을 한다. `TransactionSynchronizationManager` 의 `isCurrentTransactionReadOnly()` 가 호출된다면, 앞서 `(1)` 에서 저장해놓았던 `TransactionStatus` 정보를 쓰레드 로컬에서 추출하여 현재 트랜잭션의 ReadOnly 여부를 판단한다. 그를 기반으로 아직 제대로 결정되지 못했던 DataSource 를 확실히 결정짓게된다.

```java
@Bean
public DataSource routingDataSource(
	@Qualifier(master) DataSource masterDataSource,
	@Qualifier(slave) DataSource slaveDataSource) {

   RoutingDataSource routingDataSource = new RoutingDataSource(); // 쿼리 요청을 적절한 서버로 분기할 때 활용됨
   HashMap<Object, Object> targetDataSourceMap = new HashMap<>(); // (1)

   // targetDataSourceMap 객체에 분기할 서버들의 DataSource 빈을 저장
   targetDataSourceMap.put("master", masterDataSource); // (2)
   targetDataSourceMap.put("slave", slaveDataSource);

   routingDataSource.setTargetDataSources(targetDataSourceMap); // (3) => DataSource 타깃을 설정한다.
   routingDataSource.setDefaultTargetDataSource(masterDataSource); // (4)

	return routingDataSource;

```

- `(4)` 이렇게 동적으로 DataSource 를 결정하게 된 RoutingDataSource 를 위처럼 스프링 빈으로 등록해주면, `PlatformTransactionManager` 는 내부적으로 이 DataSource 를 사용해서 커넥션을 을 생성한다.

- `(5)` 이후 과정은 앞서 트랜잭션 동기화 과정에서 설명한 내용과 동일하다. 커넥션의 AUTO COMMIT 을 비활성화하고, 이제부터 트랜잭션을 본격적으로 시작하게 될 것이다. 그리고 이 커넥션 객체는 `TransactionSynchornizationManager` 에 보관된다.

- `(6)` 현재 트랜잭션내에서 매번 쿼리가 수행될 때 마다 `DataSourceUtils` 의 `getConnection()` 이 호출될 것이다. 이에따라 쓰레드 로컬에서 추출된 동일한 커넥션을 재사용함으로써 트랜잭션 동기화가 보장된다.

```java
@Bean
@Primary
public DataSource dataSource(){
	DataSource determinedDataSource = routingDataSource(masterDataSource(), slaveDataSource());
	return new LazyConnectionDataSourceProxy(determinedDataSource);
}
```

- `(7)` 마지막으로 `LazyConnectionDataSourceProxy` 를 사용하여 커넥션을 획득하는 시점을 **지연(Lazy)** 시킨다. 만약 이 과정이 없다면 스프링은 기본적으로 `@Transactional` 을 만나자 마자, 즉 트랜잭션에 진입하자마자 그 즉시 DataSource 를 가져오고 커넥션을 맺는다. 이 떄문에 `RoutingDataSource` 내에서 라우팅할 DataSource 를 결정하는 작업은 DataSource 로 부터 이미 커넥션을 맺은 이후에 뒤늦게 동작한다. 따라서 커넥션을 획득하는 시점을 지연시키는 것이다.

`LazyConnectionDataSourceProxy` 를 사용하면 트랜잭션 진입 시점에 실제 커넥션을 리턴하는 대신에 프록시 커넥션 객체를 대신 리턴한다고 했었다. 이를통해 커넥션이 실제로 사용되는 시점까지 커넥션 획득을 지연시켜서, AbstractRoutingDataSource 가 정상적으로 트랜잭션 ReadOnly 상태 값을 읽어올 수 있게된다.

## 참고

- 스프링 데이터베이스 1편 : 데이터 접근 핵심 원리, 김영한
- https://velog.io/@daehoon12/Spring-DB-트랜잭션-매니저
- https://jongmin92.github.io/2018/04/08/Spring/toby-5/
