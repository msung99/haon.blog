---
title: JPA의 낙관적 락을 통해 엔티티 동시성 이슈 제어하기
description: JPA 의 낙관적 락을 통해 동시성 문제를 해결해봅시다.
date: "2023-03-06"
tags:
  - JPA
  - 낙관적 락
  - 동시성
previewImage: spring.png
---

## 락(Lock) 은 왜 필요한가?

짧은시간안에 요청이 많은 서버에서 여러 트랜잭션이 동시에 간읕 데이터에 업데이트를 발생시킬 경우에, 일부 요청이 유실디는 경우가 발생하여 장애로 이어질 수 있습니다.

DBMS 에서 특정 데이터에 대한 동시접근이 발생시 일관성과 무결성이 보장되어야 합니다. 이러한 락(Lock) 을 구현하는 방식은 크게 낙관적 락(Optimistic Lock) 과 비관적 락(Pessimistic Lock)으로 나뉩니다.
(추후 설명하겠지만, 낙관적 락의 경우는 락을 구현한다는 표현은 사용하기 애매한 경계선에 있습니다.)

---

## 멀티쓰레드 환경에서의 동시성 이슈

[[Redis] 분산락(Distribution Lock) 을 구현해 다중화 서버에서 발생하는 동시성 문제 제어하기](https://velog.io/@msung99/Redis-%EB%B6%84%EC%82%B0-%EB%9D%BD%EC%9D%84-%EA%B5%AC%ED%98%84%ED%95%B4-race-condition-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%9D%B4%EC%8A%88-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0) 에서도 설명했듯이, 멸티쓰레드 환경에서는 모든 쓰레드들이 동일한 공유자원에 접근시 경쟁 상황(Race Condition) 이 발생할 수 있고, 이는 곧 동시성 이슈로 이어질 수 있다고 했었습니다.

위 내용에서 다룬것은 인프라에 다중 서버가 구축되어 있는 상황을 가정한 것이고, 저희는 단일서버임을 가정하고 조금 더 쉬운 관점으로 다시 동시성 이슈를 이해해보겠습니다.

패션몰 온라인 서비스에서 고객이 주문한 상품의 배송지를 변경하는 쓰레드와, 관리자 페이지에서 운영자가 해당 고객이 주문한 상품의 배송상태를 변경하는 쓰레드가 있다고 가정해봅시다.

![](https://velog.velcdn.com/images/msung99/post/6f239186-47b2-4047-a082-48cfc9f0207a/image.png)

위 시나리오에서 조건이 하나 있다고하죠. 배송중인 상품은 배송지를 변경할 수 있는 정책이 존재한다고 해봅시다.

- 1. 운영자는 배송상태를 변경하기 위해, 고객은 배송지를 변경하기 위해 주문정보를 조회합니다.
- 2. 운영자는 배송상태를 배송중으로 변경합니다.
- 3. 고객이 배송지를 변경합니다. (=> But 조건으로 인해 배송지 변경이 안된다.)
- 4. 운영자, 고객애 대한 트랜잭션이 커밋과 함께 DB 에 반영됩니다.

이렇게 되면 운영자와 고객의 트랜잭션 모두 롤백(Rollback) 되지 않고 성공하는 것이죠? 운영자는 배송지를 변경못하도록 막기위해 배송상태를 변경했음에도 불구하고, 고객의 트랜잭션 성공으로 인해 배송지가 변경되버리는 상황이 발생하죠.

이런 상황을 방지하도록 DBMS 가 지원하는 트랜잭션과 함께, 비즈니스 로직에도 추가적인 트랜잭션 처리 기법이 필요합니다. 그들이 바로 낙관적 락과 비관적 락 기법입니다.

JPA 는 데이터베이스에 대한 동시 접근으로부터 엔티티에 대한 무결성을 유지할 수 있게 해주는 동시성 제어 메커니즘을 지원해주는 것입니다. 이 메커니즘에는 낙관적 락과 비관적 락이 존재하죠.

---

## 낙관적 락(Optimistic Lock)

> 동시에 동일한 데이터에 대한 여러 업데이트에 서로 간섭하지 않도록 방지하는 version 이라는 속성을 확인하여 엔티티의 변경사항을 감지하는 메커니즘

- JPA 엔티티 내부에 @Version 어노테이션이 붙은 필드를 구현해서 낙관적 락을 구현한다

낙관적 락(Optimistic Lock) 은 특정 자원에 대한 경쟁을 낙관적으로 바라보는 락 방식으로, **여러 트랜잭션이 데이터를 동시에 수정하지 않는다는 가정하에 트랜잭션 충돌을 방지하는 기법**입니다. 쉽게말해, 자원에 락을 걸어서 선점하지말고 커밋할 때 동시성 문제가 발생하면 그때 처리하자는 방법론입니다.

JPA 의 엔티티 특정 필드에 version 속성을 포함시켜서(@Version 어노테이션 붙이기), 별도의 락(Lock) 없이 트랜잭션 충돌을 방지할 수 있는 방법입니다.

```java
@Entity
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long orderId;
    private String orderName;

    @Version
    private long version;
    ...
}
```

방금 설명했듯이 데이터를 읽는 시점에서는는 락(Lock)을 별도로 설정 및 사용하지 않습니다. 하지만 트랜잭션에 의해 잘못된 업데이트(update) 을 알아서 방지하지 않습니다. 데이터를 읽는 시점에서는 락을 사용하지 않지만, 데이터를 수정하는 시점에서 앞에 읽은 데이터가 다른 사용자에 의해 변경되었는지 검사해야합니다.

- 장점 : 읽기 시점에서 락을 사용하지 않기 때문에 성능이 좋다. 동시 업데이트가 없는 경우 이 방법을 사용시 비관적 락보다 빠르게 조회 및 업데이트가 가능하다.

- 단점 : 여러 트랜잭션이 작업중에 하나의 트랜잭션이 공유자원을 변경할 경우, 다른 트랜잭션의 작업 내용이 거부된다.

### OptimisticLockException

엔티티에서 낙관적 락 충돌(트랜잭션 충돌)을 감지한경우 OptimisticLockException 예외를 발생시키게 되고, 트랜잭션을 롤백 처리합니다.
즉, 엔티티를 수정할 때마다 JPA가 자체적으로 versioning 을 지원하기 때문에 **조회시점과 수정시점의 버전이 다르면 OptimisticLockException 예외가 발생**합니다.

이에 대한 권장되는 예외처리 방법은 엔티티를 다시 로드하거나, 새로고침해서 업데이트를 재시도하는 방법입니다.

### 낙관적 락 충돌감지 상황 예시

예시를 보시면 더 이해가 잘 되실겁니다.

![](https://velog.velcdn.com/images/msung99/post/b15dd9d4-8a87-4a8d-972a-3bfb76a7dfc5/image.png)

- 1. 운영자는 배송상태를 변경하기 위해 version이 1인 주문정보를 조회한다.
- 2. 고객은 배송지를 변경하기 위해 version이 1인 주문정보를 조회한다.
- 3. 운영자는 배송상태를 배송중으로 변경한다.
- 4. 고객은 배송지를 변경한다.
- 5. 운영자의 행동이 DB에 반영됨과 함께 version이 2로 업데이트된다.
- 6. 고객의 행동이 DB에 반영됨과 함께 version1 정보를 version2 로 업데이트 할때 이미 DB 엔 해당 주문정보 엔티티에 대한 version 값이 2이므로, 누군가 수정했다고 판단하여 트랜잭션 커밋이 실패한다. (낙관적 락 충돌 감지)

---

## 낙관적 락의 LockModeType

낙관적 락을 구현시 기본적인 @Version 어노테이션만 붙여도 낙관적 락이 적용되지만, 더 세밀한 낙관적 락을 구현하고 싶다면 추가 옵션을 부여할 수 있습니다.

엔티티의 특정 필드에 version 어노테이션을 명시해줬다면, 아래처럼 추가적인 락 옵션을 통해 다양한 락을 적용시킬 수 있습니다.
**JpaRepsitory 를 사용한다면 @Lock 어노테이션의 LockModeType 를 지정할 수 있는것입니다.**

```java
@Lock(LockModeType.OPTIMISTIC)
Optional<Order> findByIdForUpdate(Long orderId);
```

### None

별도의 옵션을 사용하지 않아도 엔티티에 @Version 어노테이션이 적용된 필드만 있다면 낙관적 락이 적용됩니다.

- 용도 : 조회한 엔티티를 수정할때 다른 트랜잭션에 의해 변경(삭제)되지 않아야한다. 조회 시점부터 수정 시점까지를 보장합니다.

- 동작 : 엔티티를 수정시 버전을 체크하면서 버전을 증가합니다. (UPDATE 쿼리 사용). 이때 데이터베이스의 버전값이 현재 버전이 아니면 예외가 발생합니다.
- 이점 : 두번의 갱실분실문제 (Second Lost updates probelem) 을 예방합니다.

---

### OPTIMISTIC (Read)

엔티티 수정시에만 발생하는 낙관적 락이 읽기 시에도 발생하도록 설정하는 락 모드입니다.
트랜잭션 시작시 버전 검사가 수행되고, 트랜잭션 종료시에도 버전 검사가 수행됩니다. **읽기시에도 버전(version) 값을 체크하고 트랜잭션이 종료될 때까지 다른 트랜잭션에서 변경하지 않음을 보장합니다**

이를 통해 **Dirty Read 와 Non Repeatable Read 를 방지**합니다. 혹시 이들이 무엇인지 모르신다면 [트랜잭션의 격리수준(Transcation isolation level) 4단계, ACID 성질](https://velog.io/@msung99/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%98-%EA%B2%A9%EB%A6%AC%EC%88%98%EC%A4%80isolation-level-ACID-%EC%84%B1%EC%A7%88%EC%97%90-%EB%8C%80%ED%95%B4) 을 참고하셔도 좋습니다.

```java
@Lock(LockModeType.OPTIMISTIC)  // 방법1
Optional<Order> findByIdForUpdate(Long orderId);

entityManager.find(Order.class, orderid, LockModeType.OPTIMISTIC); // 방법2 : EntityManager 활용
```

- 용도 : 조회 시점부터 트랜잭션이 끝날때까지 조회한 엔티티가 변경되지 않음을 보장한다.

- 동작 : 트랜잭션을 커밋할 때 버전 정보를 조회해서 (SELECT 쿼리 사용) 현재 엔티티의 버전과 같은지 검증한다. 만일 버전이 다르담면 예외가 발생한다.

- 이점 : Dirty Read 와 Non-Repeatable Read 를 방지한다.

---

### OPTIMISTIC_FORCE_INCREMENT (Write)

낙관적 락을 사용하면서 버전 정보를 강제로 증가시키는 옵션입니다.
관계를 가진 다른 엔티티가 수정되면 버전이 변경됩니다. (ex. 댓글이 수정되면 게시글도 버전이 변경된다)

```java
@Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)  // 방법1
Optional<Order> findByIdForUpdate(Long orderId);

entityManager.find(Student.class, studentId, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
```

- 용도 : 논리적인 단위의 엔티티 묶음을 관리할 수 있습니다.

- 동작 : 엔티리를 수정하지 않아도 트랜잭션을 커밋할 때 버전 정보를 강제로 증가시킵니다. 예를들어 엔티티 A 에서 연관관계가 있는 엔티티 B 가 수정되었을 때 엔티티 A의 버전도 증가해야하는데, 이때 버전 정보를 강제로 증가시킵니다.

---

## 비관적 락(Pessimistic Lock)

비관적 락은 어떤 자원 경쟁을 비관적으로 바라보기 때문에, 여러 트랜잭션이 데이터를 동시에 수정할 것이라고 가정하는 기법입니다.
하나의 트랜잭션이 데이터를 읽는 시점에서 락(Lock) 을 걸고, 조회 또는 업데이트 처리가 완료될 때까지 유지합니다.

쉽게 말해, **트랜잭션의 충돌이 발생한다고 가정하고 우선 락(Lock)을 걸고 보는방법입니다.**

### 유의사항 : 데드락(DeadLock) 상황 발생

- 쓰레드1 : 정보 A를 구하고 잠금
- 쓰레드2 : 정보 B를 구하고 잠금
- 쓰레드1 : 정보 B를 구하고자할때 블로킹(Blocking)
- 쓰레드2 : 정보 A를 구하고자할때 블로킹

이런 상황이라면 두 쓰레드 모두 영원히 작업을 끝낼 수 없는 교착상태, 즉 데드락(DeadLock) 에 빠지게됩니다. 데드락이 발생하지 않도록하려면 락을 시도할때 최대 잠금 시간을 지정해주면 됩니다.

- 장점 : 트랜잭션의 동시 접근을 확실하게 방지해서 순차적인 처리가 가능하다.

- 단점 : 한 트랜잭션 내용이 완료되기 전까지 다른 트랜잭션이 공유자원에 접근하지 못해서, 동시성이 떨어져 **대기가 길어지고 성능이 떨어질 수 있습니다.**
  또한 각 트랜잭션이 서로 자원을 점유한 채, 서로의 자원을 요청하며 무한정 대기하는 **데드락(DeadLock)** 상황이 발생할 수 있습니다.

### 비관적 락 충돌감지 예시

비관적 잠근은 어떤 쓰레드가 아래처럼 주문에 대한 트랜잭션을 먼저 시도했다면, 주문 정보에 대한 트랜잭션이 끝나기 전까지는 다른 쓰레드들이 주문정보를 조회 및 트랜잭션 시도를 못하도록 잠그는 방식입니다.

![](https://velog.velcdn.com/images/msung99/post/6a246c86-92b0-465a-abc4-e42530ade652/image.png)

### 비관적 잠금의 LockModeType

이 내용을 다루려면 공유 락(Shared Lock), 베타 락(Exclusive Lock) 에 대해서 이해해야하며, 이들로 다른 트랜잭션에서 READ, UPDATE, DELETE 하는 연산을 방지할 수 있습니다. 내용이 너무 길어지는 것 같아, 바로 다음 포스팅에서 다루어보겠습니다.

- +추가 : 다음 포스팅 내용은 [JPA, MySQL 8.0 에서의 비관적 락, 공유 락(Shared Lock)과 배타 락(Exclusive Lock)](https://velog.io/@msung99/JPA-%EC%9D%98-%EB%B9%84%EA%B4%80%EC%A0%81-%EB%9D%BD%EC%97%90-%EB%8C%80%ED%95%9C-LockModeType-%EA%B3%B5%EC%9C%A0-%EB%9D%BD%EA%B3%BC-%EB%B0%B0%ED%83%80-%EB%9D%BD) 을 참고해주세요!

---

## 참고

- [JPA의 낙관적 잠금(Optimistic Lock), 비관적 잠금(Pessimistic Lock)](https://velog.io/@lsb156/JPA-Optimistic-Lock-Pessimistic-Lock)
- [낙관적 잠금과 비관적 잠금으로 동시성 해결하기](https://escapefromcoding.tistory.com/727)
- [비관적 잠금(선점 잠금, Pessimistic Lock)과 낙관적 잠금(비선점 잠금, Optimistic Lock)](https://hwannny.tistory.com/81)
- [JPA의 낙관적 락과 비관적 락을 통해 엔티티에 대한 동시성 제어하기](https://hudi.blog/jpa-concurrency-control-optimistic-lock-and-pessimistic-lock/)
