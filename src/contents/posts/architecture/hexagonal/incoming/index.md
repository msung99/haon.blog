---
title: 헥사고날 아키텍처에서 인커밍 어뎁터 구현하기
date: "2023-05-09"
tags:
  - 아키텍처
  - 헥사고날 아키텍처
previewImage: architecture.png
series: Hexagonal Architecture
---

## 학습배경

[[Hexagonal Architecture] 헥사고날 아키텍처에서 유즈케이스(UserCase) 구현하기](https://velog.io/@msung99/Hexagonal-Architecture-%ED%97%A5%EC%82%AC%EA%B3%A0%EB%82%A0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%97%90%EC%84%9C-%EC%9C%A0%EC%A6%88%EC%BC%80%EC%9D%B4%EC%8A%A4UserCase-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0) 에서는 헥사고날의 코어에 위치한 핵심 계층에 속한 도메인과 유즈케이스를 구현헤봤습니다. 이에 이어서, `웹 어댑터(인커밍 어댑터)` 를 구현하고 헥사고날에 대해 더 깊이있는 학습을 진행하고자 포스팅을 진행합니다.

---

## 웹 어댑터

웹 어댑터는 외부로부터 요청을 받아 애플리케이션 코어를 호출하고 무슨일을 해야하는지 알려줍니다. 이떄 제어흐름은 웹 어댑터에 있는 컨트롤러에서 애플리케이션 계층에 있는 서비스로 흐르죠. **애플리케이션 계층은 웹 어댑터가 통신할 수 있는 특정 포트를 제공해주며, 서비스는 이 포트를 구현하며 웹 어댑터는 이 포트를 호출할 수 있습니다.**

### 의존성 역전

![](https://velog.velcdn.com/images/msung99/post/fe6823af-3235-4874-b741-5336827bf567/image.png)

예를들어 위와같이 각 서비스는 인커밍 포트 인터페이스를 구현하고 있으며, 웹 어댑터들은 본인의 기호에 알맞게 원하는 포트들을 의존하며 호출할 수 있게됩니다. 이를통해 저희는 서비스와 인커밍 포트 사이에서 `의존성 역전 원칙` 이 적용된 것을 발견할 수 있습니다. 또 DIP 가 적용됨으로써 코어 계층을 보호할 수 있게 되는 것이죠.

### 웹 어댑터가 아웃고잉 어댑터 역할도 동시에 수행하는 상황

참고로 알아야 할 것은, 웹소캣과 같이 실시간 데이터를 웹 어댑터에 보내야하는 것들은 인커밍 포트가 아닌 아웃고잉 포트를 거치게 됩니다. 즉 서비스가 아닌 웹 어댑터가 포트(아웃고잉 포트) 를 구현하게 되면서, 웹 어댑터가 인커밍 어댑터이면서 동시에 아웃고잉 어댑터가 되는데 이러한 특이 케이스들은 이번에 고려하지 않겠습니다. **다시말해, 웹 어댑터가 일반적인 케이스인 인커밍 어댑터 역할만 한다고 가정하겠습니다.**

### 포트(Port) 계층은 왜 필요할까?

또한 의존성 역전 원칙이 적용됨으로써, 제어흐름이 왼쪽에서 오른쪽 방향으로 흐르기 때문에 웹 어댑터가 유스케이스를 직접 호출할 수 있게됩니다. 그렇다면 왜 어댑터와 유스케이스 사이에 또 다른 간접 계층(포트) 를 넣어야할까 의문점이 생길 수 있는데, 이는 **애플리케이션 코어가 외부 세계와 통신할 수 있는곳에 대한 명세가 바로 포트이기 떄문입니다.** 포트를 적절한 곳에 위치시키면, 외부와 어떤 통신이 일어나고 있는지 정확히 알 수 있고, 이는 레거시코드를 다루는 유지보수 엔지니어에게는 정말 소중한 정보입니다.

---

## 웹 어댑터의 책임

다음으로 웹 어댑터가 수행하는 책임에 대해 파악하고, 그를 기반으로 스프링부트 애플리케이션에서 어떻게 구현을 할 수 있는지 알아봅시다. 우선 웹 어댑터는 일반적으로 다음과 같은 역할을 수행합니다.

> - 1.  HTTP 요청을 자바 객체로 변환

- 2. 입력 (웹 어댑터의 입력 모델) 유효성 검증
- 3. 입력 (웹 어댑터의 입력 모델) 을 유즈케이스 입력모델로 변환
- 4. 유스케이스 호출
- 5. 유스케이스의 출력을 HTTP 로 변환
- 6. HTTP 응답을 반환

웹 어댑터는 `HTTP 요청을 수신`하고, 해당 HTTP 요청에 담긴 여러 정보를 기반으로 자바의 객체로 받아들이게 됩니다.

### 입력 유효성 검증

그러고 `입력 유효성 검증`을 수행하는데, 이때 말하는 입력 유효성 검증은 이전에 다루었던 유즈케이스에서의 유효성 검증과는 엄연히 다른것입니다. 여기서 말하는 것은 웹 어댑터의 입력 모델에 대한 유효성 검증이며, 당연히 유즈케이스에서의 입력 모델에 대한 유효성 검증과는 다릅니다. 유즈케이스의 입력 모델과는 구조나 의미가 완전히 다를 수 있기 떄문에, 또 다른 유효성 검증을 웹 어댑터에서 입력 모델에 대해 수행해야합니다.

또한 유스캐이스 입력 모델에서 했던 유효성 검증을 똑같이 웹 어댑터에서도 구현해야하는 것은 아닙니다. 대신에, **웹 어댑터의 입력 모델을 유스케이스의 입력 모델로 변환할 수 있다는 것을 검증해야합니다.** 이 변환이 불가능하다면 유효성 검증 에러가 되는것이죠.

### 유스케이스 호출

그렇게 입력 유효성 검증에 성공했다면, 자연스래 웹 어댑터의 입력모델은 유스케이스의 입력 모델로 변환되어 있을겁니다. 변환된 해당 인풋모델을 유스케이스로 전송하고
( = 유스케이스를 호출하고 ), 유스케이스가 일련을 과정을 수행후 뱉어낸 출력을 웹 어댑터에게 가져다주면 그를 HTTP 로 변환해서 클라이언트에게 응답을 보내면 될 것입니다.

---

## 컨트롤러 구현하기

그럼 지금부터 인커밍 어댑터를 스프링부트 애플리케이션에서 간단하게 구현해보겠습니다. 인커밍 어댑터의 종류는 정말 다양하겠지만, 앞서 언급해왔던 웹 어댑터를 가정했으며 어떻게해야 더 좋은 아키텍처 구조를 만들 수 있을지에 대해 간단히 언급해보고자 합니다.

### 컨트롤러 세분화 분할

웹 어댑터는 컨트롤러로 구현됩니다. 이 **컨트롤러는 가능한 많게 세분화하여 배치하는 것이 좋습니다.** 여러 컨트롤러로 세분화시킴으로써, 각 컨트롤러가 소수의 기능만 가지면서 타 컨트롤러와 적은 자원(클래스 등등)을 공유하도록 하는것이 좋다는 것입니다.

예를들어 AccountController 를 정의했다고 해봅시다. 이 컨트롤러 안에는 다음과 같이 계좌와 관련된 여러 Rest API 기능을 제공한다고 해보죠.

```java
@RestController
@RequiredArgsConstructor
public class AccountController {
	private final LoadAccountQuery loadAccountQuery; // 인커밍 포트 유즈케이스들
    private final ListAccountQuery listAccountQuery;
    private final GetAccountBalanceQuery getAccountBalanceQuery;
    private final SendMoneyUseCase sendMoneyUseCase;

    @GetMapping("/accounts/{accountId}")
    AccountResource getAccount(@PathVariable("accountId") Long accountId){
        return loadAccountQuery.getAccountInfo(accountId);
    }

    @GetMapping("/accounts")
    List<AccountResource> listAccounts(){
        return listAccountQuery.getAccountListInfo();
    }

    @PostMapping("/accounts/create")
    AccountResource registerAccount(@RequestBody AccountResource accountResource){
        // ...
    }
}
```

어렇게 되면 한 컨트롤러내에 계좌와 관련한 모든것들이 있어서 "계좌관련 기능" 어댑터 자체를 찾는것은 쉽습니다. 그러나 이 컨트롤러안에 계좌와 관련된 API 가 1000개가 넘어간다, **단번에 계좌의 특정 프로덕션(기능)을 제공하는 특정 API 를 찾기란 꽤나 어렵습니다.** 또 컨트롤러에 코드가 많으면 그에 해당하는 테스크 코드도 정말 많아지므로, 특정 프로덕션(기능)의 API 에 대한 테스트 코드를 작성후, 추후에 그 테스트 코드가 어딨는지 찾기란 정말 어려워집니다.

또한 위처럼 "계좌 관련" **모든 연산을 단일 컨트롤러에 넣는것은 동일한 데이터 구조(모델 클래스) 재활용을 촉진하게 된다는 문제점을 지닙니다.** 위에서는 AccountResource 라는 동일한 모델 클래스를 여러 연산에서 사용하고 있는데, 각 연산은 이 모델 클래스에서 각각 필요없는 필드들이 있을텐데, 그들에 대해서 어떻게 처리해야할지 혼동을 줄 수 있습니다.

### 유즈케이스를 고려한 컨트롤러

또 **메소드와 클래스명은 최대한 유즈케이스를 반영헤서 작성하는 것이 좋습니다.** 예를들어 계좌를 새롭게 생성하는 컨트롤러 및 API 를 개발하고 싶은경우, 위와같이 AccountController 라고 포괄적인 의미를 가진 이름을 정의하는 것이 아니라, RegisterAccountController 와 같이 정의하고, 그 안의 메소드명은 regstierAccount 와 같이 더 명확히 식별가능한 이름으로 지어주는 것이 좋겠죠?

### 유즈케이스를 고려한 전용 모델 클래스 정의

마찬가지 이유로, **각 컨트롤러마다 전용 모델 클래스를 보유하는 것이 좋습니다.** 가령 RegisterAccountController 라는 컨트롤러를 만들었을떄, 해당 컨트롤러에 대한 전용 클래스로 AccountResource 가 아니라 RegisterAccountResource 라는 전용 모델 클래스를 부여하는 것이 좋을겁니다.

또한 전용 모델 클래스는 컨트롤러의 패키지에 대한 private 으로 선언하는 것이 좋습니다. 그를통해 실수로 다른 컨트롤러 재사용될 일이 없도록 하는것이죠. private 으로 지정함으로써 뜬금없이 다른 컨트롤러에서 사용하려는 상황이 발생해도, 사용을 막아버릴 수 있는것입니다.  
RegisterAccountController 에서 전용 클래스로 RegisterAccountResource 를 사용한다면, DeleteAccountResource 와 같은 다른 컨트롤러의 전용 모델 클래스를 사용할 수 없게 된다는 것입니다.

---

## 컨트롤러 리팩토링

앞서 살펴봤던 개선법들을 적용해서, AccountController 를 리팩토링 해봅시다. 간단한 예시를 보이기위해 자세한 예외처리 및 응답방식은 간단히 구현했으며, 저희가 이번에 짚어야할 핵심은 어떻게 컨트롤러가 분할되었으며, 그 안의 메소드나 전용 모델 클래스가 생성되었는가 입니다.

### InquiryAccountController

우선 계좌 정보를 조회하는 InquiryAccountController 를 생성했습니다. 인커밍 포트 인터페이스를 2개 의존하고 있죠. 이 컨트롤러에 대해서 전용 모델 클래스로 InquiryAccountResource 를 지정해줬으며, 메소드 이름도 신경써서 get 이라는 키워드를 붙여줬습니다.

```java
@RestController
@RequiredArgsConstructor
public class InquiryAccountController {
    private final LoadAccountQuery loadAccountQuery;  // 인커밍 포트 인터페이스를 의존
    private final ListAccountQuery listAccountQuery;

    @GetMapping("/accounts/{accountId}")
    InquiryAccountResource getAccount(@PathVariable("accountId") Long accountId){
        return loadAccountQuery.getAccountInfo(accountId);
    }

    @GetMapping("/accounts")
    List<InquiryAccountResource> getListAccounts(){
        return listAccountQuery.getAccountListInfo();
    }
}
```

### RegisterAccountController

또 다음으로 계좌 생성에 대한 컨트롤러를 별도로 세분화해서 정의해줬는데, 전용 모델 클래스로 RegisterAccountResource 를 만들어준것을 볼 수 있습니다. 앞서 말했듯이 컨트롤러는 세분화하는것이 좋기 때문에, "게좌 관련" 이라는 동일한 기능상에 있음에도 별도로 컨트롤러를 분리해줬습니다.

또 앞서 설명한 방식대로 웹 어댑터 입력모델을 유즈케이스 입력모델로 변환후 유즈케이스를 호출해줬습니다. 호출된 유즈케이스는 이를 구현한 서비스 구현내용에 따라서 비즈니스 로직이 실행되며 영속성 어댑터(아웃고잉 어댑터) 를 통해 DB 에 계좌 정보를 생성후, 적절한 리턴값을 다시 유즈케이스에게 반환해주었을 겁니다. 마지막으로 반환값에 따른 유즈케이스의 출력(리턴값) 을 HTTP 로 변환후 클라이언트에게 응답해주는 것을 볼 수 있습니다.

```java
@RestController
@RequiredArgsConstructor
public class RegisterAccountController {
    private final RegisterAccountUseCase registerAccountUseCase; // 인커밍 포트 인터페이스를 의존

    @PostMapping("/account")
    String registerAccountResource(@RequestBody RegisterAccountResource registerAccountResource){
        // 웹 어댑터 입력모델(RegisterAccountResource) 을 유즈케이스 입력모델(RegisterAccountCommand) 로 변환
        RegisterAccountCommand registerAccountCommand = new RegisterAccountCommand(registerAccountResource.getAccountNumber(), registerAccountResource.getUsername(), 0L);
        // 유즈케이스 호출
        String responseName = registerAccountUseCase.registerAccount(registerAccountResource);
        // 유스케이스의 출력을 HTTP 로 변환후 응답
        return responseName + "님의 계좌 생성이 완료되었습니다!";
    }
}
```

### RegisterAccountResource

추가적으로 계좌 생성 컨트롤러에 대한 전용 모델 클래스인 RegisterAccountResource 는 아래처럼 간단히 정의해줬습니다. 유저이름과 계좌번호를 입력받죠.

```java
@Getter
public class RegisterAccountResource {
    String username;
    String accountNumber;
}
```

### RegisterAccountCommand

바로 이어지는 유즈케이스 입력모델은 아래처럼 정의해줬습니다. initMoney 라는 필드가 추가된것을 볼 수 있습니다.

```java
@Setter
@AllArgsConstructor
public class RegisterAccountCommand {
    String username;
    String accountNumber;
    Long initMoney; // 초기 잔액
}
```

---

## 정리

이렇듯 애플리케이션 웹 어댑터를 구현할때, HTTP 요청을 애플리케이션의 유즈케이스에 대한 메소드 호출로 변환하고 결과를 다시 HTTP 로 변환하고, 어떤 도메인 로직도 수행하지 않는 어댑터를 만들고 있다는점을 염두에 둬야합니다.

또 애플리케이션 계층은 HTTP 에 대한 상세정보를 노출시키지 않도록 HTTP 와 관련된 작업을 해서는 안됩니다. 이를 지켜야지 필요할 경우 웹 어댑터를 다른 어댑터로 쉽게 교채할 수 있게 됩니다.

또 웹 컨트롤러를 세분화할시, 모델을 공유하지 않는 여러 작은 전용 모델 클래스로 만드는 것에 익숙해져야합니다. 작은 클래스들은 더 파악하기 쉽고 테스트하기 쉽기 떄문입니다.

---

## 더 학습할 키워드

- 영속성 어댑터 구현하기
- 전용 모델 클래스에 대한 pricate, public 접근 제한자 지정
