---
title: JPA의 비관적 락, MySQL 8.0 공유락과 베타락을 통한 동시성 제어
description: JPA 의 비관적 락, 공유 락(Shared Lock) 과 베타 락(Exlusive Lock) 을 통해 동시성을 제어한다.
date: "2023-03-07"
tags:
  - JPA
  - 비관적 락
  - 동시성
  - 공유락
  - 배타락
previewImage: spring.png
---

[JPA 의 낙관적 락(Optimistic Lock) 과 비관적 락(Pessimistic Lock) 으로 엔티티에 대한 동시성 이슈 제어하기](https://velog.io/@msung99/JPA-%EB%82%99%EA%B4%80%EC%A0%81-%EB%9D%BDOptimistic-Lock-%EA%B3%BC-%EB%B9%84%EA%B4%80%EC%A0%81-%EB%9D%BDPessimistic-Lock-%EC%9D%84-%ED%86%B5%ED%95%9C-%EB%8F%99%EC%8B%9C%EC%84%B1-%EC%9D%B4%EC%8A%88-%ED%95%B4%EA%B2%B0) 에서도 설명했듯이, 비관적 락은 여러 트랜잭션간의 충돌이 발생한다는 가정하에 우선 락을 걸고 보는 방법이였습니다.

그리고 비관적 락을 구현하는 방법에는 공유 락(Shared Lock), 배타 락(Exclusive Lock) 이 존재합니다. 이들이 무엇인지 알아보고, 지난 내용에 이어 JPA 에서 제공하는 비관적 락에 대한 구현방법을 알아봅시다.

---

## 공유 락 (Shared Lock)

공유 락(Shared Lock) 은 읽기 락(Read Lock) 이라고도 불립니다. **공유 락이 걸린 데이터에 대해서는 읽기 연산(SELECT) 만 가능하며, 쓰기 연산은 불가능합니다.**

공유 락이 걸린 데이터에 대해서 다른 트랜잭션도 똑같이 공유락을 획득해서 읽기가 가능합니다. 하지만 배타 락(Exclusive Lock) 은 획득할 수 없습니다. 공유 락이 걸려도 다른 트랜잭션들이 읽기 작업은 가능하다는 뜻입니다.

공유 락을 사용하면, 조회한 데이터가 트랜잭션 내내 변경되지 않음을 보장한다.

> - 다른 트랜잭션들에 대해 읽기 허용, 쓰기 방지

- 배타락이 없는경우 사용가능

## 배타 락 (Exclusive Lock)

배타 락은 쓰기 락(Write Lock) 이라고도 불립니다. 데이터에 대해 베타 락을 획득한 트랜잭션은 읽기 연산과 쓰기 연산 모두 실행할 수 있죠. 하지만 다른 트랜잭션은 배타 락이 걸린 데이터에 대해 읽기 작업도, 쓰기 작업도 수행할 수 없습니다. 즉 트랜잭션 A가 다른 트랜잭션이 락이 걸려 읽기, 쓰기 작업을 진행하지 못하게 되는 **블로킹(Blocking)** 상태가 됩니다.

즉, 배타 락이 걸려있다면 다른 트랜잭션은 공유 락, 배타 락 둘다 획득할 수 없습니다.
**배타 락을 획득한 트랜잭션은 해당 데이터에 대해 독점권을 가지게 되는 것입니다.**

---

## 배타락을 구현시 데드락(DeadLock) 이 발생한다?

지난번에 언급한 내용이지만, 더 부가설명을 붙여보겠습니다. 비관적 락을 구현할 경우 언제든 교착상태(DeadLock) 이 발생할 가능성을 염두해둬야 합니다.

### 트랜잭션이 락을 획득하지 못하는 경우

공유락과 달리 배타락은 공유락과 배타락 모두 획득할 수 없고 대기상태에 빠져수도 있게 됩니다. 트랜잭션이 락을 획득하지 못하게 된 경우에는 락을 획득하기 위해 대기하게 됩니다

데드락이란 서로가 점유하고 있는 자원에 대해 무한정 대기하고 있는 상황을 의미합니다. 특정 데이터를 점유한다는 락(Lock)의 특성상 데드락이 발생할 수 있죠. 지난번에도 예시를들며 설명했지만, 새로운 예시로 다시 살펴봅시다.

![](https://velog.velcdn.com/images/msung99/post/027c3e5f-5bd6-4af7-a4bd-3cd6174b5302/image.png)

트랜잭션 A와 B는 동시에 실행된 상태이며, 각각 Order, User 데이터에 대해 조회 및 업데이트를 하며 배타락을 걸게된 상태입니다. 추후 트랜잭션 A 와 B 가 서로가 조회했었던 타인의 자원(데이터)에 접근하는데, 락이 걸린 상태로 인해 무한정 대기하게 되는 데드락 상태에 빠지게 되는 것입니다.

### DeadLock 해결방안

데드락을 해결하기 위한 방법으로 다음과 같은 해결방안들을 생각해볼 수 있습니다.

- 트랜잭션 진행방향을 같은방향으로 처리합시다.
- 트랜잭션 처리속도를 최소화해서, 데드락에 빠지는 상황을 방지합시다.
- LOCK TIMEOUT 을 이용하여 락 해제 시간을 조절해서 데드락으로부터 빠져나오게 합시다.

```java
@Transactional(timeout = 10)
public RegisterRes makeOrder(Long courseIdx){
    ...
}
```

---

## JPA의 비관적 락 LockModeType

JPA 에서는 @Lock 어노테이션을 통해 비관적 락과 추가 세부옵션을 지원해줍니다. 앞서 살펴본 공유 락, 배타 락등 비관적 박을 어떤 방식으로 구현할지 옵션을 지정할 수 있습니다.
비관적 락은 주로 PESSIMISTIC_WRITE (배타 락)을 사용합니다.

### PESSIMISTIC_WRITE

해당 자원에 데이터베이스 **베타 락(쓰기에 락)**을 걸때 사용합니다.
다른 트랜잭션에서 읽기와 쓰기 모두 불가능합니다.

```java
@Transactional
@Lock(value = LockModeType.PESSIMISTIC_WRITE)
public int order(String name, int price)

// 또는 아래처럼 JpaRepository 에도 적용 가능하다
public interface OrderRepository extends JpaRepository<Order, Long> {
   @Lock(LockModeType.PESSIMISTIC_READ)
   Optional<Order> findOrderEntityById(Long orderId);
}

// 또는 Row JPA 를 사용하고 있다면 EntityManager 를 통해 직접 락 옵션을 지정할 수 있습니다.
entityManager.lock(order, LockModeType.PESSIMISTIC_WRITE);
```

- 이점 : Dirty Read 가 발생하지 않고 공유 락을 획득하며, 데이터가 UPDATE, UPDATE 되는 것을 방지할 수 있습니다.

---

### PESSIMISTIC_READ

해당 자원에 **공유 락(Shared Lock)**을 걸때 사용합니다.
다른 트랜잭션에서는 읽기는 가능하지만 쓰기는 불가능합니다.

```java
@Transactional
@Lock(value = LockModeType.PESSIMISTIC_READ)
public int order(String name, int price)
```

- 이점 : 배타 락을 획득하고 데이터를 다른 트랜잭션에서 READ, UPDATE, DELETE 하는것을 방지할 수 있습니다.

---

### PESSIMISTIC_FORCE_INCREMENT

해당 자원에 **배타 락**을 걸며, 비관적 락 중 유일하게 버전 정보를 사용한다. **비관적 락이지만 버전 정보를 강제적으로 증가**시킵니다.

이 잠금은 PESSIMISTIC_WRITE와 유사하게 작동 하지만 @Version이 지정된 Entity와 협력하기 위해 도입되어 PESSIMISTIC_FORCE_INCREMENT 잠금을 획득할 시 버전이 업데이트 됩니다.

```java
@Transactional
@Lock(value = LockModeType.PESSIMISTIC_FORCE_INCREMENT)
public int order(String name, int price)
```

---

## MySQL 8.0 에서의 공유 락, 베타 락

공유 락, 베타 락에 대한 옵션은 Auto Commit 이 비활성화 되거나, BEGIN 또는 START TRANSACTION 명령을 통해 트랜잭션이 시작된 상태에서만 락이 유지됩니다.

### 공유 락

SELECT FOR SHARE 를 사용하여 특정 데이터로부터 공유 락을 획득할 수 있습니다.

```java
SELECT * FROM Order WHERE id = 1 FOR SHARE;
```

### 배타 락

SELECT FOR UPDATE 를 사용해서 특정 데이터로부터 배타 락을 획득할 수 있습니다.

```java
SELECT * FROM Order WHERE id = 1 FOR UPDATE;
```

---

## 트랜잭션 격리수준과 락의 차이

공부를 하면서 햇갈린 점이 하나 있습니다. 바로 트랜잭션의 격리수준과 앞서 살펴본 락의 차이입니다. 정리해보자면 다음과 같습니다.

- 격리수준은 해당 트랜잭션이 다른 트랜잭션에서 변경한 데이터를 볼 수 있는 기준을 정의한 것입니다.
- 락(Lock) 은 다른 트랜잭션에서 해당 데이터에 접근하는 것을 막는 기능을 수행하는 것입니다.

---

## 때로는 비관적 락이 성능이 좋을때가 있다?

추가적으로 낙관적 락은 일반적으로 비관적 락보다 성능이 좋은게 맞으나, 간혹 데이터 성향에 따라 비관적 락이 더 좋은 경우도 있습니다. 예를들어 재고가 1개인 상품이 있고, 100만 유저가 동시에 주문을 요청하는 상황입니다.

비관적 락의 경우 1명의 유저 외에는 대기를 하다가 미리 트랜잭션 충돌 여부를 파악하게 됩니다. 즉, 재고가 없음을 미리 알리고 복잡한 처리를 하지 않아도 됩니다.

반면 낙관적 락의 경우, 동시 요청을 보낸 유저들에 대해 순차적으로 처리하다가 커밋하는 시점이 되어서야 재고가 없음을 파악하게 됩니다. 또 처리한만큼 롤백도 해야하기 때문에, 자원 소모도 크게 발생하게 됩니다.

---

## 참고

- [MySQL 8.0의 공유 락(Shared Lock)과 배타 락(Exclusive Lock)](https://hudi.blog/mysql-8.0-shared-lock-and-exclusive-lock/)
- [Spring MVC 동기화와 JPA 잠금기법](https://galid1.tistory.com/790)
- [JPA 비관적 잠금(Pessimistic Lock)](<https://isntyet.github.io/jpa/JPA-%EB%B9%84%EA%B4%80%EC%A0%81-%EC%9E%A0%EA%B8%88(Pessimistic-Lock)/>)
- [JPA에서 낙관적 락(Optimistic Lock)과 비관적 락(Pessimistic Lock) 사용](https://devbksheen.tistory.com/228)
- [[JPA] 비관적 락과 낙관적 락, 트랜잭션의 격리 수준](https://kafcamus.tistory.com/48)
- [[Spring + JPA] jpa에서 Repository를 이용한 비관적락을 구현해봅시다. With MariaDB](https://sabarada.tistory.com/187)
- [[DB] 트랜잭션과 락 - 2. 공유락(Shared Lock) & 배타락(Exclusive Lock)](https://velog.io/@on5949/DB-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EA%B3%BC-%EB%9D%BD-2.-%EA%B3%B5%EC%9C%A0%EB%9D%BDShared-Lock-%EB%B0%B0%ED%83%80%EB%9D%BDExclusive-Lock)
- [낙관적 잠금과 비관적 잠금으로 동시성 해결하기](https://escapefromcoding.tistory.com/727)
- [JPA의 낙관적 잠금(Optimistic Lock), 비관적 잠금(Pessimistic Lock)](https://velog.io/@lsb156/JPA-Optimistic-Lock-Pessimistic-Lock#%EB%B9%84%EA%B4%80%EC%A0%81-%EC%9E%A0%EA%B8%88)
- [JPA의 낙관적 잠금(Optimistic Lock), 비관적 잠금(Pessimistic Lock)](https://velog.io/@lsb156/JPA-Optimistic-Lock-Pessimistic-Lock)
- [JPA - 비관적 락, 낙관적 락 (+ 트랜잭션 격리 수준) 정리!](https://jaehoney.tistory.com/159)
