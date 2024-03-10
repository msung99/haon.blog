---
title: 헥사고날 아키텍처에서 영속성 어뎁터 구현하기
date: "2023-05-13"
tags:
  - 아키텍처
  - 헥사고날 아키텍처
previewImage: architecture.png
---

## 학습배경

[[Hexagonal Architecture] 헥사고날 아키텍처에서 인커밍 웹 어댑터(Adapter) 를 컨트롤러로 구현하기](https://velog.io/@msung99/Hexagonal-Architecture-%ED%97%A5%EC%82%AC%EA%B3%A0%EB%82%A0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%97%90%EC%84%9C-%EC%9D%B8%EC%BB%A4%EB%B0%8D-%EC%96%B4%EB%8C%91%ED%84%B0Adapter-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0) 에서 인커밍 어댑터중에 웹 어댑터를 구현했습니다. 이어서 영속성 어댑터를 통해 헥사고날의 기초 아키텍처 구성을 완성시켜보고자 합니다.

---

## 영속성 어댑터

헥사고날에서 영속성 어댑터는 `"주도되는"` 또는 `"아웃고잉"` 어댑터입니다. 애플리케이션 서비스는 영속성 기능을 사용하기 위해 포트 인터페이스 (아웃고잉 포트) 를 구현하며, 해당 포트 인터페이스는 영속성 어댑터 클래스에 의해 구현됩니다.

### 의존성 역전

![](https://velog.velcdn.com/images/msung99/post/2f12e187-a6c6-42cc-8bbe-a04311696be6/image.png)

포트는 사실상 애플리케이션 서비스와 영속성 코드 사이의 간접적인 계층입니다. 매번 언급했듯이 영속성 문제에 신경쓰지 않고 도메인 코드를 개발하기 위해, 즉 영속성 계층에 대한 코드 의존성을 제거하도록 이러한 간접 계층을 추가하고 있습니다.

---

## 영속성 어댑터의 책임

영속성 어댑터는 일반적으로 다음과 같은 역할을 수행합니다.

> - 1. 아웃고잉 포트로부터 입력을 받는다.

- 2.입력을 데이터베이스 포맷(ex. JPA 엔티티 객체) 로 변환한다.
- 3.입력을 데이터베이스로 보낸다.
- 4.데이터베이스 출력을 애플리케이션 서비스 계층에 대한 포맷으로 변환한다.
- 5.출력을 아웃고잉 포트에게 리턴한다.

영속성 어댑터는 아웃고잉 포트를 통해 입력을 전달받습니다. 이때 `입력모델`은 포트 인터페이스가 지정한 도메인 엔티티나, 또는 특정 데이터베이스 연산 전용 객체가 될 것입니다.

그러고 영속성 어댑터는 전달받은 입력을 SQL 쿼리문으로 변환하거나, DB 를 변경하는데 사용할 수 있는 형식으로 입력을 변환시킬겁니다. 예를들어 JPA 를 사용하는 경우, 입력을 JPA 엔티티 객체로 변환하겠죠. 만약 JPA 를 사용하지 않아도, jdbcTemplate 과 같이 입력모델을 평범한 SQL 구문으로 변환해서 DB 에 쿼리를 보내도 됩니다.

그 뒤로, 영속성 어댑터는 DB 에 쿼리를 날리고 쿼리 결과를 받아오게 됩니다. 그리고 DB 로 부터 받은 결과값을 포트에 정의된 출력모델로 변환해서 서비스 계층에 응답하게 되는 메커니즘입니다.

이때 가장 중요한것은, 영속성 어댑터의 입력모델이 영속성 어댑터 내부에 있는것이 아니라 에플리케이션 코어(아웃고잉 포트)에 있다는 점입니다. 따라서 **영속성 어댑터 내부를 변경하는 것이 코어에 영향을 미치지 않습니다.**

또 **입출력 모델이 영속성 어댑터가 아닌, 애플리케이션 코어에 위치해 있다는 점**을 기억합시다.

---

## 아웃고잉 포트 세부 분할하기

스프링부트 애플리케이션에서 어떻게 구현할지 코드를 직접 보기전에, 유용한 설계 방법을 짚고 넘어갑시다.

### ISP 를 적용한 플러그 앤드 플레이 (Plug and Play)

우선 **각 서비스는 실제로 필요한 포트 인터페이스에만 최소한으로 의존해야합니다.** 즉, 포트를 하나로 놓고 그 안에 여러 기능을 위한 메소드를 엄청 만들어서 모든 서비스가 해당 포트에만 의존해야하는 설계가 아니라, 여러 기능에 대한 포트를 여러개로 분할해서 각 서비스가 본인에게 알맞는 포트에만 최소한으로 의존하게 만들자는 것입니다.

![](https://velog.velcdn.com/images/msung99/post/e1189726-6760-4354-ae45-7056965a381d/image.png)

만약 하나의 아웃고잉 포트 인터페이스에 모든 데이터베이스 연산을 모아두면 모든 서비스가 실제로는 필요하지 않은 메소드에 의존하게 됩니다. 그렇게 된다면, DB 연산에 의존하는 각 서비스는 인터페이스에서 단 하나의 메소드만 사용하더라도 `"넓은" 포트 인터페이스`에 의존성을 갖게 됩니다. 코드에 불필요한 의존성이 생길 수 있게 되는것입니다.

![](https://velog.velcdn.com/images/msung99/post/6a7d6a0c-d9a0-4970-8b76-f15239037bd2/image.png)

이때 바로 `ISP (인터페이스 분리 원칙)` 을 적용하면, 클라이언트는 오로지 본인이 필요로하는 메소드만 알면 되도록 넓은 인터페이스를 `특화된 좁은 포트 인터페이스`로 분리할 수 있게됩니다. 즉, ISP 를 적용하면 각 서비스는 필요한 최소한의 포트에만 의존하게 됩니다. 이렇게 매우 좁은 포트를 만드는것은 `플러그 앤드 플레이(plug-and-play)` 경험으로 만들며, 서비스 코드를 짤때는 그저 필요한 포트에만 꽂기만하면 됩니다.

---

## 스프링부트 영속성 어댑터 구현하기

[[Hexagonal Architecture] 헥사고날 아키텍처에서 인커밍 웹 어댑터(Adapter) 를 컨트롤러로 구현하기](https://velog.io/@msung99/Hexagonal-Architecture-%ED%97%A5%EC%82%AC%EA%B3%A0%EB%82%A0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%97%90%EC%84%9C-%EC%9D%B8%EC%BB%A4%EB%B0%8D-%EC%96%B4%EB%8C%91%ED%84%B0Adapter-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0) 에서 다루었듯이, 도메인 계층과 웹 계층을 구현했다면 지금부터 영속성 계층을 구현해 볼 상황입니다. 지금부터 애플리케이션을 간단히 설계해봅시다.

### 프로젝트 개요

![](https://velog.velcdn.com/images/msung99/post/3a0928d6-b93d-4257-80d2-68dfa585969e/image.png)

프로젝트 구성을 간단히 짚어보자면 위와 같습니다. adapter.out 을 보면 Account 와 Billing 관련 어댑터가 구현된 것을 볼 수 있습니다. 또 AccountRepository 를 볼 수 있는데, 이는 추후 또 살펴보겠지만 Spring Data JPA 의 인퍼페이스입니다. 또한 port.out 에 아웃고잉 포트가 존재하는 것을 볼 수 있는데, 이는 아웃고잉 포트를 의미합니다.

모든 폴더의 클래스 및 인터페이스를 살펴보지는 말고, 영속성 계층과 그와 관련한 애플리케이션 계층의 일부를 살펴봅시다.

### Account

우선 도메인 엔티티인 Account 를 다시 보고 넘어가야합니다. 이전까지 저는 도메인 엔티티를 JPA 의 @Entity 어노테이션을 붙인 영속성 계층의 엔티티에다 일부 비즈니스 로직을 포함시킨 개념인것으로 착각하고 있었습니다.

하지만 둘은 엄연히 다릅니다. 도메인 엔티티는 DDD 에서 비즈니스 핵심 로직을 나타내는 객체입니다. 반면 영속성 계층의 엔티티는 데이터베이스와의 상호작용을 처리하고 영속성과 관련된 기술적인 책임을 지닙니다.

```java
package usecase.core.domain;

public class Account {

    // 비즈니스 규칙 검증을 위한 메소드
    // 비즈니스 규칙 : "출금 계좌는 초과 인출되어서는 안된다"
    public boolean withdraw(Long sendPrice, Long remainPrice){
        return sendPrice < remainPrice;
    }
}
```

### LoadAccountPort, UpdateAccountStatePort

아웃고잉 포트를 담당하는 2개의 인터페이스입니다. 이때 LoadAccountPort 를 보면 Money 라는 리턴타입이 있는데, 이는 애플리케이션 계층에 출력을 리턴해주기 위한 출력 모델입니다.

```java
public interface LoadAccountPort {
    Money getRemainMoney(Long accountId);
}


public interface UpdateAccountStatePort {
    boolean updateAccountRemainMoney(Long userId, Long money);
}
```

### Money

아웃고잉 포트의 출력모델인 Money 는 아래와 같이 간단히 구현해줬습니다.

```java
@Getter
public class Money {
    Long savedPrice;

    public Money(Long savedPrice) {
        this.savedPrice = savedPrice;
    }
}
```

### AccountJpaEntity

영속성 계층에 해당하는 엔티티입니다. 도메인 엔티티와는 엄연히 다른 개념임을 주의하고 넘어가야합니다. 앞서 언급했듯이, 영속성 계층의 엔티티는 데이터베이스와의 상호작용을 처리하고 영속성과 관련된 기술적인 기능을 담당합니다.

```java
@Entity
@Table(name = "account")
@Data @AllArgsConstructor @NoArgsConstructor
public class AccountJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private Long userId; // 어떤 유저에 대한 계좌인지
    private Long savedPrice; // 계좌 잔여량
}
```

### AccountRepository

기본적인 CRUD 기능과 DB 에서 원하는것을 로드하기 위해 스프링부트에서 제공하는 인터페이스인 Spring Data JPA 를 사용했습니다. 스프링부트는 이 레포지토리 인터페이스에 대한 구현체를 자동으로 제공하는 마법을 부립니다.

```java
public interface AccountRepository extends JpaRepository<AccountJpaEntity, Long> {

    // @Query("select m from AccountJpaEntity m where m.userId = :userId")
    AccountJpaEntity findAccountJpaEntityByUserId(Long userId);
}
```

### AccountPersistenceAdapter

이번에 다루는 내용중의 가장 핵심인 영속성 어댑터입니다. 보듯이 이 어댑터는 LoadAccountPort, UpdateAccountStatePort 라는 2개의 아웃고잉 포트를 구현하면서, 의존성 역전을 하게됩니다. 또 직전에 살펴본 AccountRepository 인터페이스를 통해 데이터베이스와 원하는 결과를 추출할 수 있게 됩니다.

updateAccountRemainMoney 메소드를 살펴보면서, `영속성 어댑터의 책임` 이 잘 지켜지고 있는지를 봅시다. 우선 파라미터인 userId, money 를 보면 입력을 받게되고, accountRespository 를 활용해서 입력을 데이터베이스 포맷으로 변환 및 전송하는 것을 볼 수 있습니다. 즉, 입력(userId, money) 를 JPA 엔티티 객체인 AccountJpaEntity 로 변환하게 됩니다.

또 updateAccountRemainMoney 에는 출력값이 단순히 boolean 타입이지만, getRemainMoney 메소드를 보면 DB 로 부터 리턴받은 결과 (AccountJpaEntity) 를 애플리케이션 포맷인 Money 로 변환하고 리턴하는 모습을 볼 수 있습니다. 이 Money 는 아웃고잉 포트인 LoadAccountPort 에서 규약해놓은 것이므로, 이 영속성 어댑터에서는 Money 타입으로 반드시 애플리케이션 계층에다 리턴해야합니다.

```java
@RequiredArgsConstructor
@Component
public class AccountPersistenceAdapter implements LoadAccountPort, UpdateAccountStatePort {
    private final AccountRepository accountRepository;

    @Override
    public Money getRemainMoney(Long accountId){
        AccountJpaEntity accountJpaEntity = accountRepository.findById(accountId).get();
        Money money = new Money(accountJpaEntity.getSavedPrice());
        return money;
    }

    @Override
    public boolean updateAccountRemainMoney(Long userId, Long money){
    	// 입력을 데이터베이스 포맷(JPA 엔티티 객체) 로 변환
        AccountJpaEntity accountJpaEntity = accountRepository.findAccountJpaEntityByUserId(userId);
        Long remainPrice = accountJpaEntity.getSavedPrice();
        accountJpaEntity.setSavedPrice(remainPrice - money);
        accountRepository.save(accountJpaEntity);

        // 출력모델을 애플리케이션 계층에 리턴
        return true;
    }
}
```

---

## 데이터베이스 트랜잭션 처리

트랜잭션은 하나의 특정한 유즈케이스에 대해서 일어나는 모든 쓰기 작업에 걸쳐 있어야합니다. 그래야지 그 중 하나라도 실패할경우 다 같이 롤백될 수 있기 때문입니다. 스프링에서 제공하는 선언전 트랜잭션 `@Transactional` 어노테이션을 애플리케이션 서비스 클래스에 붙여서, 스프링이 모든 public 메소드를 트랜잭션으로 감싸게 해줍시다.

영속성 어댑터는 어떤 데이터베이스 연산이 같은 유스케이스에 포함되는지 알지 못하기 때문에, 언제 트랜잭션을 열고 닫을지 결정할 수 없습니다. 따라서 이 책임은 영속성 어댑터 호출을 관장하는 서비스에 위임해야하는 것입니다.

```java

@RequiredArgsConstructor
@Transactional
public class SendMoneyService implements SendMoneyUseCase {

	// ...
}
```

---

## 정리

도메인 코드에 플러그인처럼 동작하는 영속성 어댑터를 만들면 도메인 코드가 영속성 코드와 관련된 것으로부터 분리되어 풍부한 도메인 모델을 만들 수 있습니다. 또한 `좁은 포트 인터페이스`를 사영하면 포트마다 다른 방식으로 구현할 수 있는 유연함이 생깁니다.

심지어 포트 뒤에서 애플리케이션이 모르는데도 다른 영속성 기술로 바꿔치기 하는것도 가능하죠. `포트의 명세` 만 잘 지켜진다면 영속성 계층 전체를 교체할 수도 있습니다.

---

## 아직 해결하지 못한 궁금증 포인트

사실 앞서 언급했듯이 도메인과 영속성 엔티티는 서로 분리되어야하는 것이 맞다고 했으나, 아직 정확한 이해를 하지 못했습니다. 도메인에 Account 에 JPA 어노테이션인 @Entity 를 붙여서 이를 그대로 데이터베이스에 엔티티로 저장하면 안될까? 라는 생각이 아직도듭니다. 추후 학습하겠지만, 이렇게 분리하는 이유는 `매핑하지 않기 전략` 을 위해서라고 합니다. 조만간 이 궁금증을 꼭 해결해봐야 겠습니다.

---

## 더 학습해볼 키워드

- 매핑하기 않기 전략 : 도메인 엔티티와 영속성 엔티티의 구분을 통해 어떻게 풍부한 도메인 설계가 가능해지는 것인가?
- 바운디드 컨텍스트
- 애그리거트
