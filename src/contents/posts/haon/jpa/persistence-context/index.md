---
title: JPA의 영속성 컨텍스트 핵심 개념
date: "2023-03-30"
tags:
  - JPA
previewImage: spring.png
---

## 학습배경

평소 Spring Data JPA 에 기반해서 개발을 진행하다보니, 순수 JPA 에 기반한 Entity 가 어떻게 매니지 되는지 잘 이해못한 상태로 코드 개발을 진행해왔습니다. 그렇다보니 코드 리팩토링을 계속 진행하며 최적화, 각종 트러블 이슈로 인한 한계에 막히게 되어서, 어떻게 엔티티가 매니지 되는지 메커니즘을 다루어보고자 합니다.

> 현 포스팅은 JPA 애 대한 기초적인 지식이 요구됩니다.

---

## Entity 와 RDB 테이블을 매핑하자

JPA 는 xml 에 있는 설정정보에 기반하여 EntityManagerFactory 를 만들어냅니다. 또 이 공장으로부터 필요할때마다 EntityManager 를 만들어냅니다. 클라이언트의 요청이 들어올때마다 DB 작업을 해야하는 경우, EntityManagerFactory 로 부터 하나의 EntityManager 를 만들어내서 작업을 진행하죠.

또 JPA 의 모든 작업은 한 트랜잭션 단위 내에서 일어나며, 이 안에서 자바의 객체와 RDB 의 데이터를 매핑하면서 작업을 수행하게 됩니다. 아래처럼 하나의 트랜잭션 단위 내에서 객체가 생성되고, 생성한 객체에 대해 CRUD 작업을 진행하여 실제 RDB 테이블에 반영시키는 것입니다.

```java
public class JpaMain {
    public static void main(String[] args){
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("info-in-xml");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction(); // 트랜잭션 생성
        tx.begin();  // 트랜잭션 시작
        try {
            Member member = new Member();
            member.setId(2L);
            member.setName("HelloB");

            em.persist(member); // 저장

            tx.commit(); // 트랜잭션 커밋
        } catch (Exception e){
            tx.rollback();
        } finally {
            em.close();
        }

        emf.close();
    }
}
```

---

## Persist Context (영속성 컨텍스트)

지금부터 JPA 의 내부구조가 어떻게 돌아가는지 알아봅시다. 이를 위해선 영속성 구조라는 것에 대해 이해해야합니다.
우선 애플리케이션을 개발하면, EntityManagerFactory 를 통해서 클라이언트의 요청이 들어올때마다 EntityManager 를 생성합니다. 또 EntityManager 를 통해서 내부적으로 DB 커넥션을 사용해서 DB 를 사용하게 되는 것입니다.

### 영속성 컨텍스트 내부 메커니즘

![](https://velog.velcdn.com/images/msung99/post/8ee6836d-8da3-43ca-a5d2-fa2e8a19f31c/image.png)

JPA 를 학습하신 분들이라면 `persist()` 에 대해 알고 계실겁니다. 이 메소드는 DB 에 데이터를 저장하기 위한 함수이죠. 이 함수가 호출되었을떄 JPA 내부는 어떻게 동작할지 알아봅시다.

### 자바 객체 생성

우선 EntityManager 를 통해 persist() 를 호출하게 될겁니다. 또 persist() 호출시 매개변수로 JAVA 객체 userA 라는 것을 저장하는 상황이라고 가정해보죠.

### 영속성 컨텍스트 진입 : 1차캐시 + SQL 저장소

persist() 호출시 userA 라는 자바 객체는 우선 영속성 컨텍스트 영역이라는 곳에 진입하게 됩니다. 또 이 영역에 진입시 Entity 라는 단위로 변환되어 진입하게 됩니다. 이렇게 영속성 컨텍스트에 진입한 엔티티는 key-value 쌍으로써 `1차 캐시`라는 영역에 저장됩니다. 또한 동시에 userA 를 DB 에 저장하기 위한 insert 쿼리가 `쓰기지연 SQL 저장소` 에 저장됩니다.

```java
@Entity
@Table(name = "DB-User")
public class User{
	@Id
    Long userIdx;
    private String name;
    private String phoneNumber;
}
```

이때 1차캐시에 key-value 포맷으로써 데이터가 저장된다고 했는데, key 값으로는 @Id 가 저장되며, value 에는 엔티티가 저장됩니다. 예를들어 위와 같이 User 엔티티가 정의되었다면, @Id 컬럼인 userIdx 값이 key 로 저장되며, value 에는 userA 이라는 엔티티 자체가 저장되는 것입니다.

### 트랜잭션 커밋시 쿼리문이 DB 에 전송된다

앞서 말씀드렸듯이, JPA 는 한 트랜잭션 단위를 기반으로 DB 에 작업을 처리한다고 했습니다. 현재 트랜잭션 단위내에 있는 모든 비즈니스 로직을 처리한후, 커밋 시점에 다가오면 트랜잭션에서 제공해주는 commit() 함수가 호출되면서 앞서 쓰기지연 SQL 저장소에 저장되었던 모든 쿼리문들이 DB 에 날라가게 됩니다.

### 정확히는 flush() 호출시 전송된다.

더 엄밀히 말하자면, commit() 이 호출되는 시점에 쿼리문이 날라가는게 아니라, flush() 가 호출될때 쿼리문이 전송되는 것입니다. commit() 을 호출할때 commit 자체에서 내부적으로 flush() 를 호출하기 때문에 DB 에 SQL 쿼리가 전송되는 것이죠.

그렇다면 만일 아래와 같이 비즈니스 로직이 수행된다면, "hihi" 라는 출력문을 결과로 얻게 되기전에는 아직 DB 에 쿼리문이 전송되지 않고 영속성 컨텍스트의 SQL 저장소 및 1차 캐시에만 반영되어 있는 상태입니다.

```java
public class JpaMain {
    public static void main(String[] args){
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("info-in-xml");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction(); // 트랜잭션 생성
        tx.begin();  // 트랜잭션 시작
        try {
            Member member = new Member(1, "hi", "010-1111-1111");
            em.persist(member); // 아직 DB 에 쿼리가 날라가지 않았다.
            System.out.println("hihi");

            tx.commit(); // 트랜잭션 커밋 => 앞서 flush() 가 호출되지 않았다면 현재 commit 호출시 저장됐을것이다.
        } catch (Exception e){
            tx.rollback();
        } finally {
            em.close();
        }

        emf.close();
    }
}
```

---

## Entity 의 생명주기

또 아셔야할게 있습니다. 바로 Entity 의 생명주기입니다. 엔티티에는 생명주기가 있는데, 크게 4가지 상태 속성으로 구분됩니다.

> - 영속 상태

- 비영속 상태
- 준영속 상태
- 삭제 상태

### 영속 상태, 비영속 상태

```java
Member member = new Member();
member.setId(1L);
member.setName("helloJPA"); // 여기까지는 비영속 상태

em.persist(member); // 영속 상태
// => But, 아직 DB 에 저장되진 않았다. 즉 SQL 쿼리가 아직 안날라감

em.detach(member); // 준영속 상태
// => member 를 영속성 컨텍스트에서 지운다

em.remove(member); // 실제 DB 에 영구 저장된 상태인 객체를 지우겠다는 요청
```

위처럼 member 객체를 생성하고 엔티티 매니저 팩토리로부터 엔티티 매니저를 얻어와서, 엔티티 매니저의 persist() 를 호출해서 member 객체를 집어넣으면, entityManager 안에 있는 영속성 컨텍스트라는 곳에 member 객체가 들어가면서 영속 상태가 됩니다.

### 준영속 상태

앞서 말씀드렸듯이 `persist()` 를 호출하면 영속상태가 됩니다. 이런 상황 외에도 영속 상태가 되는 상황이 1가지 더 있습니다. 준영속 상태란 영속 상태의 엔티티가 영속성 컨텍스트에서 분리된 상태입니다. 이렇게 되면 영속성 컨텍스트가 제공하는 기능인 `Dirty Checking`, `업데이트` 기능들을 사용하지 못합니다.

---

## Dirty Checking

그러면 저희가 JPA 를 통해 엔티티를 관리하면서 얻을 수 있는 이점은 뭘까요? 우선 더티체킹(Dirty Checking) 이 가능합니다. 엔티티 수정시 변경감지, 즉 Dirty Checking(변경감지) 라는 것을 할 수 있습니다. 아래처럼 persist() 를 하지 않아도 setName() 만 호출해도 DB 에 반영되죠.

```java
memberA.setNamge(10); // 영속 Entity 데이터 수정
// => 더티 체킹으로 인해, persist() 를 호출하지 않아도 자동으로 데이터가 수정된다.

transaction.commit(); // 트랜잭션 커밋
```

저희는 위 처럼 set() 함수를 호출시 update 와 관련한 메소드도 작성해야 할 것 같습니다. 그렇지않으면 DB 에 정상적으로 수정 변경내용이 반영되지 않을 것 같기 때문이죠. 하지만 JPA 는 자체적으로 변경내용을 체크하여 commit 시점에 내용을 반영해줍니다.

## 동일성 보장

[트랜잭션의 격리수준(Transcation isolation level) 4단계, ACID 성질](https://velog.io/@msung99/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%98-%EA%B2%A9%EB%A6%AC%EC%88%98%EC%A4%80isolation-level-ACID-%EC%84%B1%EC%A7%88%EC%97%90-%EB%8C%80%ED%95%B4) 에서도 살펴봤듯이, MySQL, PostgreSQL 와 같은 RDB 는 자체적으로 트랜잭션의 격리수준에 기반하여 격리 등급을 보장해주고 있습니다.

JPA 에서는 1차 캐시의 REPEATABLE_READ 등급의 트랜잭션 격리수준을 DB 가 아닌 애플리케이션 차원에서도 제공해주고 있습니다. 예를들어 MySQL 을 사용시 스프링부트 애플리케이션 단에서도 REPEATABLE_READ 등급의 격리수준을 보장해주는 것이죠.

```java
Member a = entityManager.find(Member.class, "member1");
Member b = entityManager.find(Member.class, "member2");

System.out.println(a == b);
```

만일 위와 같은 코드를 진행시 출력결과는 true 가 나오는 것을 보장해주는 것입니다. 자바 컬렉션에서 똑같은 객체를 가져와서 == 연산자로 비교연산을 진행하면 똑같다는 결과를 얻을 수 있듯이, JPA 도 영속 엔티티의 동일성을 보장해줍니다.

---

## 참고

[김영한 자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic/dashboard)
