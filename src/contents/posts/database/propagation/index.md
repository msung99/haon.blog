---
title: 트랜잭션의 전파(propagation) 속성과 추상화 인터페이스
date: "2023-03-09"
tags:
  - 데이터베이스
  - 트랜잭션
previewImage: database.png
---

> 현재 소개하는 트랜잭션 기능은 SpringBoot 를 기준으로 진행함을 알려드립니다.

여러 명령을 하나의 트랜잭션으로 보장받고 싶은 경우 개발자가 직접 트랜잭션의 경계설정을 통해 트랜잭션을 명시하는 일이 필요합니다.
저희가 사용하는 스프링 프레임워크를 통해 트랜잭션의 경계설정을 데이터베이스에 전달할 수 있는데, 그렇다면 이러한 트랜잭션을 어떻게 지원하고 있을까요?

## 트랜잭션 추상화 인터페이스

스프링은 트랜잭션 추상화 인터페이스인 PlatformTransactionManager 를 제공하여 다양한 DataSource 에 알맞게 트랜잭션을 관리할 수 있게 지원하고 있습니다.

```java
package org.springframework.transaction;

public interface PlatformTransactionManager extends TransactionManager {

   TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
   void commit(TransactionStatus status) throws TransactionException;
   void rollback(TransactionStatus status) throws TransactionException;

}
```

### 트랜잭션 경계설정

getTransaction 메소드를 통해 파라미터로 전달되는 TransactionDefinition 에 따라 트랜잭션을 시작합니다. 트랜잭션을 문제없이 마치면 commit 메소드를, 또는 문제가 발생하면 rollback 메소드를 호출합니다.
이렇게 getTransaction 부터 commit 또는 rollback 을 호출하는 부분까지가 트랜잭션의 경계설정입니다. 쉽게말해, **하나의 트랜잭션이 시작되면 commit() 또는 rollback() 이 호출될 때 까지의 부분들이 하나의 트랜잭션으로 묶입니다.**

### PlatformTransactionManager 구현채

그렇다면 위 PlatformTransactionManager 인터페이스를 구현하는 클래스, 즉 스프링에서 제공하는 트랜잭션 매니저 구현체에는 무엇이 있을까요?

- **DataSourceTransactionManager** : JDBC 에서 사용되는 트랜잭션 매니저
- **JpaTransactionManager** : JPA 에서 사용되는 매니저
- **JtaTransactionManager** : 글로벌 트랜잭션에서 사용되는 매니저

이 두 트랜잭션 매니저는 하나의 데이터베이스를 사용하거나 각각의 데이터를 독립적으로 사용하는 **로컬 트랜잭션**의 경우에 사용할 수 있습니다.

반면 다중 데이터베이스를 구축하는 경우라면 글로벌 트랜잭션에 사용되는 JtaTransactionManager 를 사용할 수 있습니다. 여러개의 DB에 대한 작업을 하나의 트랜잭션으로 묶을 수 있고, 다른 서버에 분산된 것도 하나로 묶을 수 있습니다.

### TransactionDefintion

앞서 보았던 PlatformTransactionManager 안에 있는 TransactionDefintion 인터페이스는 트랜잭션의 동작방식에 영향을 줄 수 있는 4가지 속성을 정의하고 있습니다. 그 4가지 속성들은 트랜잭션을 세부적으로 이용할 수 있게 도와주며, @Transactional 어노테이션도 공통적으로 적용할 수 있습니다.

> - 트랜잭션 전파 (Transaction Propagation)

- 격리수준 (Transaction Isolation)
- 제한시간 (Transaction Timeout)
- 읽기전용 (Transaction ReadOnly)

사실 조금 더 있긴하지만, 저희는 이 4가지를 중점으로 다루어볼 예정입니다.

### 선언적 트랜잭션

또, 위에서 언급한 3가지 트랜잭션 매니저외에도 다른 DataSource 가 들어올때도 사용할 수 있는 다양한 트랜잭션 매너지 구현체들이 존재합니다. 하지만, 이렇게 직접적으로 코드에 구현하는 방식 외에도 **스프링은 AOP 를 이용한 선언적 트랜잭션을 제공**하고 있습니다.

선언전 트랜잭션은 크게 2가지 방법이 있는데, 그 중 한가지가 바로 저희가 가장 많이 사용하는 @Transactional 어노테이션을 기반으로 트랜잭션을 설정하는 방법입니다.

> 선언적 트랜잭션, 즉 @Transactional 에서 제공하는 여러 옵션(속성)을 뜯어보며 트랜잭션 전파와 격리수준을 어떻게 설정할지 알아보자!

---

## @Transactional 원본

아래는 트랜잭션 어노테이션 @Transactional 에 대한 실제 구현 코드 내용입니다.
value(), transactionManager() 메소드를 보면 알수있듯이, 트랜잭션 매니저를 속성으로 지정 가능합니다. Bean 으로 등록되어있는 특수한 트랜잭션 매니저를 사용하고 싶은 경우에 지정하고 사용할 수 있습니다.

또, 아래의 여러 메소드들로 트랜잭션에 대한 세부적인 옵션을 지정할 수 있습니다. 저희는 이 메소드중에 propagation, isolation 을 자세히 뜯어보며 전파와 격리수준을 어떻게 지정해줄지 알아볼겁니다.

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {
	@AliasFor("transactionManager")
		String value() default "";

    @AliasFor("value")
	String transactionManager() default "";

    String[] label() default {};
    Propagation propagation() default Propagation.REQUIRED;
    Isolation isolation() default Isolation.DEFAULT;
    int timeout() default TransactionDefinition.TIMEOUT_DEFAULT;
    String timeoutString() default "";
    boolean readOnly() default false;
    Class<? extends Throwable>[] rollbackFor() default {};
    String[] rollbackForClassName() default {};
    Class<? extends Throwable>[] noRollbackFor() default {};
    String[] noRollbackForClassName() default {};
}
```

---

## 트랜잭션 전파란?

트랜잭션 전파 속성(Propgation) 이란 **이미 진행중인 트랜잭션에 대해 추가적인 트랜잭션 진행을 어떻게할지 결정하는 것**입니다. 예를들어 어떤 작업 A에 대한 트랜잭션이 진행중이고 작업 B가 시작될 때 어떻게 처리할까에 대한 부분입니다.
전파 속성에 따라 기존의 트랜잭션에 참여할 수도 있고, 별도의 트랜잭션으로 진행할 수도있고, 에러를 발생시키는 등 여러 선택을 할 수 있습니다.

@Transactional 은 해당 메서드를 하나의 트랜잭션 안에서 진행할 수 있도록 만들어주는 역할을 합니다. 이때 트랜잭션 내부에서 트랜잭션을 또 호출한다면 스프링에서는 어떻게 처리하고 있을까요?

```java
@Transactional
public void order(int price){
  // ...
  @Transactional
  buyItem();
}

void buyItem(){
  // ...
}
```

새로운 트랜잭션이 생성될 수도 있고, 이미 트랜잭션이 있다면 부모 트랜잭션에 합류할 수도 있을 것입니다. **진행되고 있는 트랜잭션에서 다른 트랜잭션이 호출될 때 어떻게 처리할지 정하는 것을 '트랜잭션의 전파 설정'이라고 부릅니다.**

---

## 전파 (propagation) 의 속성

지금부터 다양한 트랜잭션의 전파 속성에 대해 알아봅시다.

### REQUIRED : A의 트랜잭션에 참여

**트랜잭션 A에 B가 참여하는 방식입니다. 트랜잭션 B의 코드는 새로운 트랜잭션을 만들지 않고 트랜잭션 A에 작업중인 내용에 참여하는 방식입니다.**
이 경우 트랜잭션 B가 마무리되고 나서, A의 남은 작업 내용을 처리할 때 예외가 발생하면 A와 B의 작업 내용이 모두 롤백됩니다. 왜냐하면 A와 B의 트랜잭션이 하나로 묶여있기 떄문이죠.

```java
@Transactional(propagation=Propagation.REQUIRED)
public void A(){
  child();
  // ... (child 메소드에 대한 트랜잭션 처리후 남은 작업 내용들)
}

@Transactional
public void B(){
   // ...
}
```

### REQUIRES_NEW : 독립적인 트랜잭션 생성

**반대로 트랜잭션 B를 A와 무관하게 만들 수 있습니다.** 이 경우 B의 트랜잭션 경계를 빠져나오는 순간 B의 트랜잭션은 독자적으로 커밋 또는 롤백되고, 이것은 A에 어떤 영향도 주지 않습니다. 즉, 아래처럼 메소드 B에 대한 작업 수행 및 트랜잭션 커밋을 완료한 후 작업 (2) 를 수행하다가 예외가 발생해도 앞서 작업한 B에 대한 내용은 롤백되지 않습니다.

```java
@Transactional(propagation=Propagation.REQUIRES_NEW)
public void A(){
  // 작업 (1)
  child();
  // 작업 (2)
}

@Transactional
public void B(){
   // ...
}
```

### SUPPORTS

**부모 트랜잭션이 존재하면 부모 트랜잭션에 합류하여 트랙잭션이 적용되며 동작하며
(마치 REQUIRED처럼 동작), 없을 경우 트랜잭션이 적용되지 않은 상태로 그냥 동작합니다.** 아래의 경우 메소드 B에 대한 부모 메소드인 A는 트랜잭션이 적용되어 있는 상태이므로, 트랜잭션이 적용된 상태로 동작합니다.

```java

@Transactional
public void A(){
  child();
}

@Transactional(propagation=Propagation.SUPPORTS)
public void B(){
   // ...
}
```

### MANDATORY

이 설정이 적용된 메소드 B는 부모 메소드인 A가 트랜잭션이 적용된 상태라면 트랜잭션이 적용된 상태로 동작하고 (REQUIRED 처럼 동작), 적용 안된 상태라면 예외가 발생합니다.
아래의 경우 메소드 A가 트랜잭션이 적용된 상태이므로 예외가 발생하는 일 없이 트랜잭션으로 정상 동작합니다.

```java
@Transactional
public void A(){
  child();
}

@Transactional(propagation=Propagation.MANDATORY)
public void B(){
   // ...
}
```

### NOT_SUPPORTED : 트랜잭션 없이 동작

메소드 B의 작업에 대해 트랜잭션을 걸지 않을 수 있습니다. (특정 메소드에 대한 트랜잭션 미지원 기능) 만약 메소드 B에 작업이 단순 데이터 조회라면 굳이 트랜잭션이 필요 없겠죠.

```java
@Transactional
public void A(){
  child();
}

@Transactional(propagation=Propagation.NOT_SUPPORTED)
public void B(){
   // ...
}
```

### NESTED : 중첩(자식) 트랜잭션을 생성

이미 진행중인 트랜잭션에 트랜잭션에 중첩(자식) 트랜잭션을 만드는 것으로, 독립적인 트랜잭션을 만드는 REQUIRES_NEW 와는 다릅니다. NESTED 에 의한 중첩 트랜잭션은 부모 트랜잭션의 영향(커밋과 롤백)을 받지만, 중첩 트랜잭션이 외부에 영향을 주지는 않습니다.

```java
@Transactional
public void A(){
  child();
}

@Transactional(propagation=Propagation.NEVER)
public void B(){
   // ...
}
```

### NEVER : 전 구간에서 트랜잭션 없이 동작

메소드 B 외에도 기존 트랜잭션이 적용되는 부모 메소드 A 에서도 트랜잭션 없이 동작하도록 합니다. 만약 기존 메소드 A에 트랜잭션이 적용되는 경우 IllegalTransactionStateException 예외가 발생합니다. 아래의 경우 A에 트랜잭션이 적용되어 있으므로 예외가 발생합니다.

```java
@Transactional
public void A(){
  child();
}

@Transactional(propagation=Propagation.NEVER)
public void B(){
   // ...
}
```

---

## 트랜잭션 격리수준

[트랜잭션의 격리수준(Transcation isolation level) 4단계, ACID 성질](https://velog.io/@msung99/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%98-%EA%B2%A9%EB%A6%AC%EC%88%98%EC%A4%80isolation-level-ACID-%EC%84%B1%EC%A7%88%EC%97%90-%EB%8C%80%ED%95%B4) 에도 살펴봤듯이, 트랜잭션은 격리수준이라는 개념을 지닙니다. 동시에 여러 트랜잭션이 실행될 때 트랜잭션의 작업 내용을 다른 트랜잭션에게 얼마나 노출시킬 것인지 결정하는 것으로, **기본적으로 데이터베이스에 설정되어 있지만 이 속성을 통해 재설정할 수 있습니다.**

### 격리수준의 속성

가장 낮은 격리수준인 READ_UNCOMMITED 부터 시작해서 READ_UNCOMMITED, READ_COMMITED, REPEATABLE_READ, SERIALIZABLE 등의 설정이 있습니다. 각 격리수준은 [트랜잭션의 격리수준(Transcation isolation level) 4단계, ACID 성질](https://velog.io/@msung99/%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%98-%EA%B2%A9%EB%A6%AC%EC%88%98%EC%A4%80isolation-level-ACID-%EC%84%B1%EC%A7%88%EC%97%90-%EB%8C%80%ED%95%B4) 에서 살펴본 내용이므로 생략하겠습니다.

```java
@Transactional(isolation=isolation.READ_UNCOMMITED)
public void orderItem(int price){
    // ...
}
```

데이터베이스에서는 이러한 격리수준에 따라 트랜잭션이 실행되는 동안 각기 다른 lock을 걸고 데이터를 보호하고자 합니다. 격리수준이 높아질수록 더욱 강하게 lock을 걸고 트랜잭션을 마치면 lock을 해제합니다.

---

## TIMEOUT

다음으로 timeout 속성으로 트랜잭션 제한시간을 지정할 수 있습니다. [JPA, MySQL 8.0 에서의 비관적 락 : 공유 락(Shared Lock)과 배타 락(Exclusive Lock) 으로 동시성 이슈 제어하기](https://velog.io/@msung99/JPA-%EC%9D%98-%EB%B9%84%EA%B4%80%EC%A0%81-%EB%9D%BD%EC%97%90-%EB%8C%80%ED%95%9C-LockModeType-%EA%B3%B5%EC%9C%A0-%EB%9D%BD%EA%B3%BC-%EB%B0%B0%ED%83%80-%EB%9D%BD) 에서도 살펴봤듯이, 데드락(DeadLock) 을 해결하기 위해선 트랜잭션의 생명주기를 지정해줘야합니다.

초 단위로 제한시간을 지정할 수 있는데, 예시와 같이 어노테이션이 달린 메소드를 수행하는데 10초가 지나면 예외가 발생해 롤백됩니다. 따로 설정하지 않으면 timeout 은 지정되어 있지 않습니다.

```java
@Transactional(timeout = 10)
public void orderItem(int price){
  // ...
}
```

---

## ReadOnly

마지막으로 readOnly 로 지정하는 읽기전용 트랜잭션입니다. True 로 지정하면 트랜잭션 작업안에서 UPDATE, INSERT, DELETE 작업이 일어나는 것을 방지합니다. readOnly 의 디폴트값은 false로, 모든 작업을 허용합니다.

```java
 @Transactional(readOnly = true)
 public void orderItem(int price){
   // ...
}
```

---

## 정리

![](https://velog.velcdn.com/images/msung99/post/5b8b8438-0fd2-466d-a76e-2dbb77368229/image.png)

#### 출처 : [[Spring] 스프링의 트랜잭션 전파 속성(Transaction propagation) 완벽하게 이해하기](https://mangkyu.tistory.com/269)

---

## 참고

[[Spring] 스프링의 트랜잭션 전파 속성(Transaction propagation) 완벽하게 이해하기](https://mangkyu.tistory.com/269)
[[면접 대비] 스프링과 트랜잭션](https://velog.io/@syleemk/%EB%A9%B4%EC%A0%91-%EB%8C%80%EB%B9%84-%EC%8A%A4%ED%94%84%EB%A7%81-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98-%EC%A0%84%ED%8C%8C#%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%B4-%EC%99%9C-%ED%95%84%EC%9A%94%ED%95%9C%EA%B0%80)
[[Spring] @Transactional의 전파 레벨에 대해 알아보자](https://kth990303.tistory.com/385)
[[Spring JPA] 부모 트랜잭션 내에 자식 트랜잭션이 실행될 때 (@Transactional)](https://velog.io/@titu/Spring-JPA-%EB%B6%80%EB%AA%A8-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98-%EB%82%B4%EC%97%90-%EC%9E%90%EC%8B%9D-%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98%EC%9D%B4-%EC%8B%A4%ED%96%89%EB%90%A0-%EB%95%8C-Transactional)
[[Spring] 트랜잭션 전파 알아보기, @Transaction, propagation](https://steady-hello.tistory.com/121)
