---
title: Bulk insert(벌크 연산)를 활용하여 쿼리 성능 개선해보기
date: "2023-08-01"
tags:
  - JPA
  - JdbcTemplate
  - 벌크연산
---

## 문제 발생배경

이번에는 제가 맡은 도메인 서비스를 개발하다가 만난 "벌크 연산(Bulk Insert)" 관련 이슈에 대해 다루어보고자 합니다.

---

## JPA saveAll() 의 한계

![](https://velog.velcdn.com/images/msung99/post/6cf39e77-59b4-48d4-afe5-d3e54da4910e/image.png)

### save() 를 300번 수행한다.

기존에는 JPA 의 save() 를 활용하여, 데이터 리스트를 for-each 로 순환하며 저장하는 간단한 로직을 구현했습니다. 그러나, 약 300개의 데이터를 insert 했을때, 한번의 쿼리가 아니라 300번의 삽입 쿼리가 나가며 로직이 종료되지 않고 오래걸리는 것을 확인하게 되었습니다. 또한 당연히 응답속도가 약 `4000ms` 로 매우 느린 모습을 확인하게 되었습니다.

### saveAll() 로 개선하면 성능이 좋아질까?

그렇다면 saveAll() 을 활용했을떄, 쿼리가 단 한방에 나갈것을 기대하며 for-each 순환마다 save() 를 호출하는 로직을 제거하고, 엔티티 리스트를 만들어서 saveAll() 의 인자로 넘겨줬습니다. 그러나, 이 방식도 쿼리가 300번이 나가는것은 여전했으며, 성능 개선에 실패했었습니다.

### 쿼리 성능이 조금은 좋아졌네? 🤔

saveAll() 은 그래도 save() 를 여러번 호출하는 것에 비해서는 성능 개선이 됩니다. saveAll() 은 save() 를 여러번 호출하기 때문에 얼핏보면 똑같은 생각이 들 수 있으나, 자세히 들여다보면 두 메소드에는 `@Transactional` 기반의 트랜잭션이 발동됩니다. 즉, 300번 save() 를 호출했을때는 트랜잭션이 300번이나 실행되는 것이지만, 반면 saveAll() 은 단 한번의 트랜잭션으로 저장이 수행되는 방식입니다. 이로인해 성능 차이가 발생하는 것이죠.

---

## JPA Hibernate Batch Insert

> Hibernate disables insert batching at the JDBC level transparently if you use an identity identifier generator.

사실 JPA 환경에서 이 외에도 널리 알려진 방법은 하이버네이트 차원에서 제공하는 배치 삽입연산을 진행하는 것입니다. 그러나, `IDENTITY` 전략에서는 하이버네이트가 Batch Insert 를 비활성화 때문에 사용이 불가능합니다. 이는 `영속성 컨텍스트` 내부에서 엔티티를 식별할때는 엔티티 타입과 엔티티의 pk 값으로 엔티티를 식별하지만, IDENTITY 의 경우 DB 에 Insert 문을 실행해야만 pk 값을 확인가능하므로 비활성화하는 것입니다.

결론적으로, 저희 서비스는 `IDENTITY` 전략을 활용하므로 이는 활용하지 않았지만, `Table` 전략등의 서비스를 활용한다면 아래와 같이 배치 기능을 활성화해도 좋습니다.

```java
spring:
  jpa:
  	properties:
      hibernate:
        jdbc:
          batch_size: 100
          order_inserts: true
          order_upates: true
```

---

## JdbcTemplate BatchUpdate

결국 saveAll() 도 300번의 쿼리가 나가게 되므로, 성능 개선이 되지 못하는것은 사실입니다. 또한 앞서 설명한 JPA 의 Batch Insert 기능을 활용하자니, 저희 서비스의 `IDENTITY` 전략을 다른 전략으로 전환하는것도 꽤 부담스러운 상황이였습니다.

이를위해, JDBC 의 `batchUpdate()` 를 활용하여 벌크연산을 단 한방의 쿼리로 처리하도록 했습니다. 이를 위해선 SQL Mapper 인 `JdbcTemplate` 를 활용하는것이 통상적으로 알려진 방법이며, 저 또한 이를 활용했습니다.

### application.yml

본격적인 배치 코드 작성 이전에, 저희처럼 MySQL 를 활용하는 서비스라면 application.yml 에서 `rewriteBatchedStatement=true` 를 활성화해줍시다. 이를 활성화해야 MySQL 데이터베이스에 쿼리가 전송시 배치 단위로 전송됩니다.

```java
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test?rewriteBatchedStatements=true
    username: root
    password:
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 배치삽입 코드 구현

배치 연산을 활용한 API 및 도메인 서비스는 정말 많았지만, 그 중 코드 단위 하나를 가져와봤습니다. 아래처럼 batchUpdate 의 첫번쨰 인자로는 쿼리를, 두번째 인자로는 `BatchPreparedStatementSetter` 를 선언해주면 됩니다.

그리고 오버라이드를 수행한 `setValues` 에는 SQL 의 각 물음표 파라미터에 들어갈 데이터와 타입을 명시하면 되며, `getBatchSize` 에는 한번에 얼만큼의 배치 삽입연산을 수행할 것인지에 대한 것을 명시해주면 됩니다.

```java
@Override
public void saveAll(Map<String, List<Pair<LocalDateTime, LocalDateTime>>> taskHistorys, Long firstTaskId, Daily daily) {
	String taskHistoryInsertQuery = "INSERT INTO task_history (start_date, end_date, daily_id, task_id) VALUES (?, ?, ?, ?)";
	final long[] currentTaskId = {firstTaskId}; // 래퍼 클래스를 사용하여 final 변수 선언

	for (Map.Entry<String, List<Pair<LocalDateTime, LocalDateTime>>> taskHistoryEntry : taskHistorys.entrySet()) {
		List<Pair<LocalDateTime, LocalDateTime>> historyPairs = taskHistoryEntry.getValue();
        jdbcTemplate.batchUpdate(taskHistoryInsertQuery, new BatchPreparedStatementSetter() {

        @Override
        public void setValues(PreparedStatement ps, int i) throws SQLException {
        	Pair<LocalDateTime, LocalDateTime> dateTimePair = historyPairs.get(i);
            	ps.setTimestamp(1, Timestamp.valueOf(dateTimePair.first));
                ps.setTimestamp(2, Timestamp.valueOf(dateTimePair.second));
                ps.setLong(3, daily.getId());
                ps.setLong(4, currentTaskId[0]); // 배열 요소로 접근하여 변경 가능
		}

        @Override
        public int getBatchSize() {
        	return historyPairs.size();
       }
    });

     currentTaskId[0]++; // 다음 그룹에 대해 task_id 증가
    }
}
```

---

## 결론

결과적으로 배치 삽입 연산을 적절히 고려하니, 약 3초의 수행시간이 걸리던 API 가 약 1700ms 정도로 개선되었습니다. 지금은 대용량의 데이터가 아니라 엄청난 차이는 아닐지 몰라도, 만일 1만개 이상의 대용량의 데이터를 삽입하게 된다면 2,3배를 넘어서 더욱이 큰 성능차이가 보일겁니다 😎

---

## 더 학습해볼 키워드

- batchUpdate (이 연산을 더욱이 능숙하게 다루기 위해 추가적인 학습이 필요한 것 같습니다. 처음이라 조금 낯설기감이 있는 것 같네요 🥲

- 만일 IDENTITY 전략외에 다른 전략을 활용시 JPA 의 배치 기능을 활성화를 위한 부가적인 설정이 필요한가?

---

## 참고

- https://techblog.woowahan.com/2695/
- https://digda.tistory.com/42
- https://pepperoni.netlify.app/batch-insert/
- https://jaehun2841.github.io/2020/11/22/2020-11-22-spring-data-jpa-batch-insert/#rewrite-%EC%98%B5%EC%85%98
- https://gksdudrb922.tistory.com/154
- https://datamoney.tistory.com/319
- https://velog.io/@penrose_15/MySQL에서-Bulk-Insert를-사용하기-위한-뻘짓-모음
- https://velog.io/@choiyunh/Spring-Data-JPA-트랜잭션에서-save와-saveall-비교
