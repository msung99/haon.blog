---
title: MySQL 8.0 공유 락(Shared Lock) 과 배타 락(Exclusive Lock)
date: "2024-09-20"
tags:
  - Spring
  - 동시성
previewImage: database.png
---

스프링부트와 같이 멀티 쓰레드로 동작하는 애플리케이션에선 공유 자원에 대한 `경쟁상태(Race Condition)` 이 발생할 수 있다. 동시 접근이 발생할 경우 일관성과 무결성을 해칠 수 있기 떄문에, 해당 데이터에 대한 `잠금(Lock)` 을 걸 수 있다. 이 `잠금(Lock)` 을 거는 방식에는 크게 `공유 락` 과 `배타 락` 2가지로 나뉘는데, 이들에 대해 학습해보도록 한다.

## 공유 락(Shared Lock)

`공유 락(Shared Lock)` 은 `읽기 락(Read Lock)` 이라고도 불린다. **공유 락이 걸린 공유 자원에 대해서는 다른 트랜잭션들이 읽기 연산(SELECT) 만 실행 가능하며, 쓰기 연산은 불가능하다.** 즉, 하나의 데이터를 읽는 것을 여러 사용자가 동시에 할 수 있는 비교적 개방적인 락이다. 

공유 락이 걸린 데이터에 대해서 다른 트랜잭션도 똑같이 공유 락을 획득할 수 있지만, 배타 락은 획득할 수 없다. 즉, 읽기 연산에 대해선 얼마든지 개방적이이지만, 쓰기 연산에 대해서만 엄밀히 제한을 거는 방식이라고 볼 수 있다. **다른 트랜잭션에 의해 쓰기 연산이 절대 발생하지 않으므로, 현재 트랜잭션에서 조회한 데이터가 연산을 처리하는 동안 다른 트랜잭션에 의해 변경되지 않음을 보장한다.**


## 베타 락(Exclusive Lock)

`배타 락(Exclusive Lock)` 은 `쓰기 락(Write Lock)` 이라고도 불린다. 앞선 공유 락에 비해 공유자원에 대한 접근 가능 수준이 엄격한 락이라고 할 수 있다. 공유자원에 대해 베타 락을 획득한 트랜잭션은 읽기 연산과 쓰기 연산 모두 자유롭게 실행할 수 있다. 하지만, **현재 베타 락을 걸은 현재 트랜잭션 이외의 다른 트랜잭션은 모두 읽기 작업도, 쓰기 작업도 수행할 수 없다.** 즉, 베타 락이 걸린 공유자원에 대해 접근을 시도하려고 하는 다른 트랜잭션들은 공유 락과 배타 락을 걸을 수 없다. 애당초 접근 조차 불가능하므로, 해당 공유 자원에 접근하여 락을 거는 것 조차 불가능하다. 결국 **배타 락을 걸은(획득한) 트랜잭션은 해당 데이터에 대한 전적인 독점권을 갖게된다.**

## MySQL 8.0 에서 공유 락, 배타 락을 어떻게 획득할까?

공유 락과 배타락의 락 옵션은 Auto Commit 이 비활성화 되거나, `BEGIN` 또는 `START TRANSACTION` 명령어를 통해 트랜잭션이 시작된 상태에서만 락이 유지된다. 즉, 일반 연산이 아닌 트랜잭션 단위의 연산에 대해서만 락을 적용할 수 있다.

### 공유 락 

MySQL 8.0 엔진에서 공유 락을 걸고 싶다면 `SELECT` 문 마지막에 `FOR SHARE` 를 사용하여 현재 트랜잭션이 특정 공유 자원에 공유 락을 걸 수 있다.

~~~sql
SELECT * FROM MY_TABLE_NAME WHERE id = 1 FOR SHARE;
~~~

### 배타 락

반면 배타 락은 `FOR UPDATE` 를 사용하여 락을 걸 수 있다.

~~~sql
SELECT * FROM MY_TABLE_NAME WHERE id = 1 FOR UPDATE;
~~~

## 락을 걸때 유의할 점

### 단순 SELECT 쿼리는 락 획득을 시도하지 않는다.

MySQL InnoDB 엔진을 사용하는 테이블에선 `FOR UPDATE` 또는 `FOR SHARE` 절을 가지지 않는 `SELECT` 쿼리는 잠금(Lock) 없는 읽기가 지원된다. 즉, 특정 자원이 `FOR UPDATE` 로 락이 걸린 상태일지라해도 `FOR UPDATE`, `FOR SHARE` 가 없는 단순 SELECT 쿼리절은 락 획득을 위한 대기 없이 곧 바로 해당 데이터를 조회할 수 있다. 다시 말하면, 락을 굳이 획득할 필요가 없는 로직이 대기상태에 빠질 일이 없기 떄문에 성능상 손해를 볼 일이 발생하지 않을 것이란 뜻이된다.

### 데드락

![alt text](image.png)

배타 락을 사용하는 경우 데드락에 빠질 가능성이 높아진다. 만약 두 쓰레드가 서로가 공유 자원을 붙잡고 있고, 상대방이 붙잡고 있는 자원을 획득하길 원하는 경우 데드락에 빠질 위험이 있으니 유의해야한다.

## 참고

- https://www.youtube.com/watch?v=ZXV6ZqMyJLg
- https://hudi.blog/mysql-8.0-shared-lock-and-exclusive-lock/
- https://sabarada.tistory.com/121