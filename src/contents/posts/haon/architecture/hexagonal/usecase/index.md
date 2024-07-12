---
title: 헥사고날 아키텍처에서 유즈케이스 구현하기
date: "2023-05-07"
tags:
  - 아키텍처
  - 헥사고날 아키텍처
previewImage: architecture.png
series: Hexagonal Architecture
---

## 학습배경

지난 [[Hexagonal Architecture] 헥사고날 아키텍처로 어떻게 유지.보수 가능한 소프트웨어를 개발할까?](https://velog.io/@msung99/Hexagonal-Architecture-%ED%97%A5%EC%82%AC%EA%B3%A0%EB%82%A0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EB%A1%9C-%EC%96%B4%EB%96%BB%EA%B2%8C-%EC%9C%A0%EC%A7%80.%EB%B3%B4%EC%88%98-%EA%B0%80%EB%8A%A5%ED%95%9C-%EC%86%8C%ED%94%84%ED%8A%B8%EC%9B%A8%EC%96%B4%EB%A5%BC-%EA%B0%9C%EB%B0%9C%ED%95%A0%EA%B9%8C) 에서 다루었듯이, `헥사고날 아키텍처`에서는 `DDD(도메인 주도 설계)` 를 할수도 있고 풍부하거나(rich) 빈약한(anemic) 도메인 모델을 구현하는등 다양한 우리만의 방식을 만들어 낼 수 있습니다. 이번에는 헥사고날 아키텍처의 스타일에서 유스케이스(UseCase) 를 구현하는 방법을 학습하는겸 포스팅을 진행해보고자 합니다.

헥사고날 아키텍처는 DDD 아키텍처에 적합하기 때문에, 도메인 엔티티를 만드는것으로 시작한 후 해당 도메인 엔티티를 중심으로 유즈케이스를 구현해보겠습니다.

---

## 유즈케이스

먼저, 본격적인 구현을 하기전에 일반적인 유즈케이스는 어떤 일들을 담당하는지 알아봅시다. 아래와 같은 플로우로 유즈케이스는 본인의 역할을 수행합니다.

![](https://velog.velcdn.com/images/msung99/post/03c18692-c0bf-4cd5-ac58-9b9e4178afcc/image.png)

> - 1. 입력을 받는다.

- 2. 비즈니스 규칙을 검증한다.
- 3. 모델 상태를 조작한다.
- 4. 출력을 반환한다.

유즈케이스는 인커밍 어댑터로부터 입력을 받습니다. 이떄 유즈케이스 코드는 도메인 로직에만 신경써야하므로, `입력 유효성 검증`으로 오염되면 안됩니다. 즉, 입력값에 대한 유효성 검증은 다른 곳에서 처리하게 됩니다.

그러나 유즈케이스는 `비즈니스 규칙` 을 검증할 책임은 지닙니다. 또 도메인 엔티티와 해당 책임을 공유하죠.

비즈니스 규칙을 검증하고나면, 유즈케이스는 입력을 기반으로 어떤 방법으로든 `모델의 상태를 변경`합니다. 일반적으로 도메인 객체의 상태를 바꾸고 영속성 어댑터를 통해 구현된 포트로 해당 상태를 전달해서 저장될 수 있게합니다. 몰론 이때 유즈케이스는 또 다른 아웃고잉 어댑터를 호출할 수도 있습니다.

마지막으로 아웃고잉 어댑터에서 온 출력값을, 유즈케이스를 호출한 어댑터로 반환할 출력 객체로 변환하게됩니다.

이 단계들에 기반하여, "송금하기" 유스케이스을 구현하는 방법을 지금부터 알아봅시다. 이때 `넓은 서비스 문제` 를 피하기 위해, 모든 유스케이스를 한 서비스 클래스에 모두 넣지않고, 각 유즈케이스별로 분리된 각각의 서비스로 만들어야한다는 점을 유의하고 넘어갑시다. (단, 이번에는 "송금하기" 유즈케이스 1개만을 구현한다는 점을 알고갑시다.)

---

## 프로젝트 폴더 구성

폴더 구성은 아래와 같이 진행해줬습니다. 애플리케이션 계층안에 포트를 위한 패키지를 따로 정의하고, 또 그안에 인고잉 포트와 아웃고잉 포트를 위한 폴더를 따로 구성해줬습니다. 또한 서비스 폴더를 따로 만들어서, 그 안에 SendMoneyService 를 만들었습니다. 마지막으로 도메인을 관리하기 위한 도메인 폴더를 정의한것을 볼 수 있습니다.

이떄 어댑터를 위한 패키지를 따로 구성하지 않았습니다. 이번 포스팅의 주목적은 헥사고날의 코어인 유즈케이스와 엔티티를 구현하는 것을 중점으로 다룬다고 했으므로, 어댑터는 제외했습니다. 어댑터에 대한 구성 및 구현은 추후에 다룰 예정입니다.

![](https://velog.velcdn.com/images/msung99/post/590c9d76-9fca-4279-bf01-2730e726c546/image.png)

### 프로젝트 도식화

![](https://velog.velcdn.com/images/msung99/post/ee8817cf-a2e8-4124-8be9-4a8254b07c0f/image.png)

위 구성을 도식화해보면 이렇습니다. SendMoneyService 라는 하나의 서비스는 "송금하기" 라는 하나의 유즈케이스를 구현합니다. 또 해당 서비스는 도메인 모델을 변경하고, 변경된 상태를 저장하기 위해 아웃고잉 포트를 출력하게 됩니다.

추후 코드를 직접 보면 알겠지만, 서비스는 인커밍 포트 인터페이스인 SendMoneyUseCase 를 구현하고, 아웃고잉 포트 인터페이스인 LoadAccountPort, UpdateAccountPort 를 final 필드로 보유하고 있습니다.

또 인고잉 포트 패키지(application.port.in) 을 보면 SendMoneyCommand 클래스가 있는것을 볼 수 있는데, 이는 사용자로부터 입력을 받는 입력 모델(input model) 입니다.

---

## 도메인 엔티티

지금부터 "송금하기" 에 대한 유즈케이스를 구현해봅시다. 실제 현업에서는 아래처럼 간단한 엔티티 설계가 이루어지지 않겠지만, 현 포스팅은 학습을 위한것이므로 간단히 설계를 진행해봤습니다.

### Account Entity

```java
public class Account {

    // 비즈니스 규칙 검증을 위한 메소드
    // 비즈니스 규칙 : "출금 계좌는 초과 인출되어서는 안된다"
    public boolean withdraw(Long sendPrice, Long remainPrice){
        return sendPrice < remainPrice;
    }
}

```

이렇게 도메인 엔티티를 정의했고, 사용자가 UI 에서 송금하기 버튼을 누를때마다 Account 엔티티의 money 필드의 계좌 잔고량에서 일정 금액이 빠져나가는 로직이 헥사고날의 코어에 만들어질겁니다.
이때 주의해야 할점은 `도메인 엔티티` 와 `영속성 엔티티` 는 엄연히 절대 다른 개념이라는 점 입니다. 사실 Account 엔티티에서 일정 금액이 인출되는 필드가 존재한다고 방금 말씀드렸는데, 이는 영속성 계층의 엔티티를 말하는것겁니다. @Entity 어노테이션이 붙은 것을 영속성 계층의 엔티티라고 말하는 것이죠. **도메인 엔티티는 위처럼 비즈니스 규칙과 관련된 필드 및 메소드를 포함하고 정의합니다.**

---

## Service

다음으로 이번의 핵심이라 할 수 있는 서비스에 대해 어떻게 구현했는지 알아봅시다.

```java
package usecase.core.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import usecase.core.application.port.in.SendMoneyCommand;
import usecase.core.application.port.in.SendMoneyUseCase;
import usecase.core.application.port.out.LoadAccountPort;
import usecase.core.application.port.out.UpdateAccountStatePort;
import usecase.core.domain.Account;

@RequiredArgsConstructor
@Transactional  // 서비스(OrderService) 는 인커밍 포트 인터페이스인 OrderUseCase 를 구현했다. => 하나의 서비스가 "송금하기" 라는 하나의 유즈케이스(를 구현했다.
public class SendMoneyService implements SendMoneyUseCase {

    private final LoadAccountPort loadAccountPort; // 아웃고잉 포트 인터페이스 : 계좌 정보 불러오기 기능 포함
    private final UpdateAccountStatePort updateAccountStatePort; // 아웃고잉 포트 인터페이스 : 해당 유저의 계좌 잔액을 최신화하기 기능 포함
    // -> 이러한 아웃고잉 포트들은 아웃고잉(영속성) 어댑터와 연결될 것이다.

    @Override
    @Transactional
    public String sendMoney(SendMoneyCommand sendMoneyCommand) { // 1. 입력을 받는다
        // 2. 비즈니스 규칙을 검증한다 (도메인 엔티티에서 검증한다. 또는 유스케이스 코드에서 도메인 엔티티 사용전에 검증함)
        // 이 경우는 도메인 엔티티에서 검증하는 경우를 사용했다.
        Account account = loadAccountPort.getAccountInfo(sendMoneyCommand.getUserId());

        if(!account.withdraw(sendMoneyCommand.getSendPrice())){  // 도메인 엔티티 Account 에서 정의한 비즈니스 규칙을 검증
            return "계좌의 잔액이 부족합니다. 따라서 송금이 정상처리되지 않았습니다!"; // -> 유효성 검증이 실패할 경우 유효성 검증 예외를 던진다. 이 부분은 추후에 어댑터가 구현되면 사용자에게 제대로된 예외 에러 메시지를 리턴해주는 방식으로 리팩토링될 예정
        }

        // 모델 상태 조작
        updateAccountStatePort.updateAccountRemainMoney(sendMoneyCommand.getUserId(), sendMoneyCommand.getSendPrice());

        // 출력을 반환
        return account.getUsername() + "님의 송금이 정상처리 되었습니다.";
    }
}
```

보듯이 SendMoneyService 서비스는 SendMoenyUseCase 라는 인커밍 포트 인터페이스를 구현하고 있습니다.

또 그 아래에는 아웃고잉 포트 인터페이스에 대한 변수를 final 필드로 선언한 모습을 볼 수 있습니다. 지금은 어댑터 구현방법을 다루지 않겠지만, 각 아웃고잉 포트들은 추후 구현에 따라서 영속성 어댑터와 연결될겁니다. LoadAccountPort 는 계좌를 불러오기 위해 포트이며, UpdateAccountStatePort 는 데이터베이스의 계좌 상태를 업데이트하기 위한 포트임을 알고갑시다.

### sendMoney

또 sendMoney 라는 메소드를 선언한 것을 볼 수 있습니다. 송금을 위한 메소드로써 우선 웹 계층으로부터 SendMoneyCommand 라는 `입력을 받게`됩니다. 그러고 나서 아까 말했듯이, `비즈니스 규칙`을 검증하고, `모델의 상태를 조작`하며, 마지막으로 `출력을 리턴`하는 과정을 수행하게 됩니다.

추후 설명하겠지만, 지금 보듯이 입력 유효성과 비즈니스 규칙이라는 키워드가 계속 등장하고 있습니다. 가뜩이나 이들이 무엇인지도 햇갈리는데, 언제 입력 유효성을 검증하고 또 언제 비즈니스 규칙을 검증해야하는지도 알아야해서 더욱이 혼동이 올 수 있습니다. 이들에 대해서도 이어서 설명드리겠습니다.

---

## 비즈니스 규칙 vs 입력 유효성

간단하게 차이를 짚고 넘어갑시다. 우선 입력 유효성이란 말 그대로 입력된 인풋에 대한 유효성을 검증하는 것입니다. 이어서 설명할 내용이지만, 입력 유효성은 보통 애플리케이션 계층의 `입력모델(input model)` 에서 검증을 수행합니다.
반면 비즈니스 규칙이란 유즈케이스의 로직의 일부로써, 보통 `도메인 엔티티` 또는 `유즈케이스 코드` 에서 도메인 엔티티를 사용하기전에 규칙 검증이 구현됩니다.

입력 유효성을 검증하는 것은 구문상의 유효성을 검증하는 것이라고도 할 수 있으며, 반면 비즈니스 규칙은 유스케이스의 맥락 속에서 의미적인 유효성을 검증하는 일이라고 할 수 있습니다.

### 예시

"출금 계좌는 초과 출금되어서는 안된다" 라는 규칙은, 정의에 따르면 이 규칙은 출금 계좌와 입금 계좌가 존재하는지 확인하기 위해 **도메인 모델의 현재 상태에 접근해야 하므로 비즈니스 규칙입니다.** 반면 "송금되는 금액은 0보다 커야한다" 라는 규칙은 **모델에 접근하지 않고도 검증될 수 있기 때문에** 입력 유효성 검증으로 구현할 수 있습니다.

> - 비즈니스 규칙을 검증하는 것은 도메인 모델의 현재 상태에 접근해야하는 반면,

- 입력 유효성 검증은 도메인 모델에 접근할 필요가 없다!

---

## 입력 유효성 검증

### 어디서 검증할까?

입력을 어디서 검증할지 생각해보면, 결론부터 말하자면 애플리케이션 계층에서 검증해야 합니다. 더 정확하는 애플리케이션 계층의 `입력 모델(input model)` 에서 검증하는게 좋습니다. 애플리케이션 계층에서 입력 유효성을 검증해야 하는 이유는, 그렇지 하지 않을경우 애플리케이션 코어의 바깥쪽으로부터 유효하지 않은 입력값을 받게되고, 모델의 상태를 해칠 수 있기 때문입니다.

가령 인커밍 어댑터에서 유스케이스에 입력을 전달하기 전에 유효성 검증을 구현하는 경우를 생각해봅시다. **유스케이스는 하나 이상의 여러 어댑터에서 호출될텐데, 그러면 유효성 검증을 각 어댑터에서 전부 구현해야 하는 번거로움이 발생합니다.** 그 과정에서 실수를 범할 가능성이 굉장히 커지죠.

### 입력 모델

```java
// 입력 모델(Input Model)
@Getter
public class SendMoneyCommand {
    @NonNull // 유효성 검증 어노테이션 및 코드를 통해 유스케이스 구현체 주위에 사실상 오류 방지 계층을 만들었다.
    private final Long userId;   // (= 잘못된 입력을 호출자에게 돌려주는 유즈케이스 보호막 역할)
    @NonNull
    private final Long sendPrice;


    // 생성자 내에서 유효성 규칙을 검증한다.
    private SendMoneyCommand(Long userId, Long orderPrice){
        this.userId = userId;
        this.sendPrice = orderPrice;
        requireGreaterThan(orderPrice); // Bean의 유효성 검증 외에도 송금액이 0보다 큰지 검사하는 로직을 직접 구현함
    }

    public boolean requireGreaterThan(Long sendPrice){
        return sendPrice > 0;
    }
}
```

위와같이 SendMoneyCommand 라는 입력모델을 구현하고, 입력모델 안의 생성자에서 유효성 검증을 진행할 수 있습니다. SendMoneyCommand 는 유즈케이스 API 의 일부이기 떄문에 인커밍 포트 패키지에 위치합니다. 따라서 유효성 검증이 애플리케이션 코어에 남아있지만, 선성한 유즈케이스 코드를 오염시키지는 않습니다.

또 @NonNull 을 통해 유효성 검증을 편리하게 사용하고 있습니다. 이런 Bean Validation 을 활용한 방식만으로 특정 유효성 검증 규칙을 표현하기 충분치 않다면, 송금액이 0보다 큰 검사하는 등의 규칙은 위처럼 requireGreaterThan 과 같이 직접 만들어주면 됩니다.

### 유스케이스 보호막 역할

이렇듯 입력 모델은 그 안의 유효성 검증 코드를 통해 유스케이스 구현체 주위에 사실상 오류 방지 계층을 만들어낸것입니다. 잘못된 입력을 호출자에게 돌려주는 유스케이스 보호막으로써 작용한다는 것이죠.

### 각 유스케이스별로 전용 입력모델을 만들자

각기 다른 유스케이스에 동일한 입력모델을 사용하고 싶은 생각이 들때가 있습니다. 예를들어 "계좌 등록하기" 와 "계좌 정보 업데이트하기" 라는 2가지 유즈케이스를 보면, 둘다 거의 똑같은 계좌 상세 정보가 필요하게됩니다.

#### null 값을 허용해야하는 상황

하지만 엄밀히 둘의 차이점은 분명 존재합니다. "계좌 등록하기" 유즈케이스는 계좌를 귀속시킬 소유자의 ID 가 필요한 반면, "게좌 정보 업데이트하기" 유즈케이스는 업데이트할 계좌를 특정하기 위해 계좌 ID 정보를 필요로하죠. 따라서 두 유스케이스에서 동일한 모델을 공유할 경우 각각 소유자 ID 와 계좌 ID 에 null 값을 허용해야합니다.
이는 **불변 커맨트 객체의 필드에 대해서 null 을 유효한 상태로 받아들이는 것이므로 바람직하지 못합니다. **

따라서 **각 유스케이스 전용 입력모델을 만드는 것이 좋습니다.** 이는 유스케이스를 훨씬 명확하게 만들고 다른 유스케이스와의 결합도 제거해서 불필요한 부수효과가 발생하지 않게하죠.

### 각 유스케이스별로 전용 출력모델을 만들자

입력과 마찬가지로, 각 유스케이스별로 전용 출력모델을 만드는것도 중요합니다. 출력은 호출자에게 꼭 필요한 최소한의 데이터만 들고있는게 좋습니다.  
만약 여러 유스케이스들간에 같은 출력 모델을 공유하게되면 유스케이스들도 강하게 결합됩니다. 한 유스케이스에서 출력 모델에 새로운 필드가 필요해지면 이 값과 관련없는 다른 유스케이스에서도 이 필드를 처리해야합니다.  
즉, `단일 책임원칙(SRP)` 를 적용하고 모델을 분리해서 유지하는 것은 유스케이스의 결합을 제거하는데 큰 도움이 됩니다.

---

## 비즈니스 규칙 검증

### 도메인 엔티티에서 규칙 정의

그렇다면 비즈니스 규칙 검증은 어떻게 구현할까요? 가장 좋은 방법은, 앞서 살펴본 "출금 계좌는 초과 인출되어서는 안된다" 규칙에서처럼 **비즈니스 규칙을 도메인 엔티티 안에 넣는것입니다.**

```java
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username; // 현 계좌의 유저이름
    private Long remainPrice; // 계좌 잔액 잔여량

    // 비즈니스 규칙 검증을 위한 메소드
    // 비즈니스 규칙 : "출금 계좌는 초과 인출되어서는 안된다"
    public boolean withdraw(Long sendPrice){
        return sendPrice < remainPrice;
    }
}
```

위 Account 엔티티는 앞서 기존에 설명드렸던 엔티티에 withdraw() 라는 메소드를 추가했습니다. 이렇게 하면 이 규칙을 지켜야하는 비즈니스 로직 바로 옆에 규칙이 위치하기 때문에 위치를 정하는 것도 쉽고, 추론하기도 쉽습니다.

```java
// SendMoneyService 의 sendMoney() 메소드 일부 코드 추출
Account account = loadAccountPort.getAccountInfo(sendMoneyCommand.getUserId());

if(!account.withdraw(sendMoneyCommand.getSendPrice())){
  return "계좌의 잔액이 부족합니다. 따라서 송금이 정상처리되지 않았습니다!";
}
```

그러고 정의한 withdraw() 를 위처럼 서비스에서 활용하면 되는것입니다.

### 유스케이스 코드에서 규칙 정의

위처럼 도메인 엔티티에서 비즈니스 규칙 검증을 정의해도 좋지만, **유스케이스 코드에서 도메인 엔티티를 사용하기전에 검증을 시도**해도 좋습니다. 유효성을 거검증하는 코드를 호출하고, 유효성 검증이 실패할 경우 예외를 던집니다. 사용자와 통신하는 웹 어댑터는 이 예외를 에러 메시지로 사용자에게 보여주거나 적절한 다른 방법으로 처리합니다.

```java
Account account = loadAccountPort.getAccountInfo(sendMoneyCommand.getUserId());

if(account.getRemainPrice() < sendMoneyCommand.getSendPrice()){
  return "계좌의 잔액이 부족합니다. 따라서 송금이 정상처리되지 않았습니다!";
}
```

---

## 읽기전용 유스케이스

앞서 살펴본 유스케이스 방식은 모델의 상태를 변경하는 과정이 포함되어있습니다. 그러나 읽기 전용 유스케이스를 구현하고 싶은 경우, 해당 과정이 생략될 것입니다.

그런데 UI 에 계좌잔액을 표시하는 등의 작업을 진행하기위해 새로운 유스케이스를 구현하는 일은 꽤나 애매해집니다. 애플리케이션 코어의 관점에서 봤을떄, 그 작업은 정말 간단한 데이터 쿼리이므로 프로젝트 맥락에서 유스케이스로 간주되지 않는다면 실제 유스케이스와 구분하기위해 쿼리로 구현할 수 있습니다.

### 쿼리 서비스

이를 구현하는 방법은 여러가지가 있겠지만, 그 중 한가지 방법은 **쿼리를 위한 인커밍 포트 인터페이스를 만들고, 그를 쿼리 서비스에 구현하는 것입니다.**
쿼리 서비스는 유스케이스 서비스와 동일한 방식으로 동작합니다. 인커밍 포트를 구현하면 됩니다.

```java
@RequiredArgsConstructor
public class GetAccountService implements GetAccountBalanceQuery {
    private final LoadAccountPort loadAccountPort;

    @Override
    public Account getAccount(AccountId accountId){
        return loadAccountPort.getAccount();
    }
}
```

---

## 더 학습해볼 키워드

- 어댑터 구현하는 방법
- builder 패턴을 어떻게 생성자에서 적용하는가?
