---
title: 헥사고날 아키텍처로 어떻게 유지.보수 가능한 소프트웨어를 개발할까?
date: "2023-04-29"
tags:
  - 아키텍처
  - 헥사고날 아키텍처
---

> 헥사고날 아키텍처는 "의존성 역전"에서 부터 시작한다.

## 전통적 계층형 아키텍처

[[Clean Architecture] 클린 아키텍처에서는 전통적 계층구조의 의존성 문제를 어떻게 해결했을까?](https://velog.io/@msung99/Clean-Architecture-%ED%81%B4%EB%A6%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%97%90%EC%84%9C%EB%8A%94-%EC%9D%98%EC%A1%B4%EC%84%B1-%EB%AC%B8%EC%A0%9C%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%B4%EA%B2%B0%ED%95%A0%EA%B9%8C) 에서도 다루었듯이, 기존 전통적 구조는 많은 문제점을 지니고 있습니다.
`도메인 중심 개발` 이 먼저 선행되어야 의존성 문제를 벗어날 수 있으나, 아키텍처를 고려하지 않은 대부분의 프로젝트는 `데이터베이스 중심적인 아키텍처`를 구성한다는 것이죠.

### ORM 에 의한 지름길 선택하기

특히 ORM 프레임워크를 계층형 아키텍처와 결합하면, 비즈니스 규칙을 영속성 관점과 섞고 싶은 유혹을 쉽게 받게됩니다. ORM 에 의해 관리되는 엔티티들은 일반적으로 영속성 계층에 둡니다. 게층은 아래 방향으로만 접근 가능하기 떄문에, 도메인 계층에서는 이러한 엔티티에 접근할 수 있습니다.

하지만 이렇게 되면 **영속성 계층과 도메인 계층 사이에 강한 결합이 생기게 됩니다.** 영속성 코드가 사실상 도메인 코드아 녹아들어가서 둘 중 하나만 바꾸는 것이 어려워지죠.

### 비대해지는 영속성 계층

전통적 계층형 아키텍처에서 허용되는 유일한 규칙은, 특정 계층에서는 같은 계층 또는 아래있는 계층에만 접근 가능하다는 것입니다. 따라서 상위 계층에 대한 컴포넌트를 접근하고 싶은경우, 해당 컴포넌트 계층을 한 단계 낮춰서 설계하고 당장의 개발을 쉽게하는 `지름길은 택하는 상황` 이 발생하게 됩니다.

결국 수년에 걸쳐 개발된 프로젝트는, 대부분의 코드가 영속성 계층에 위치하면서 해당 계층에 비대해지는 현상이 발생합니다. 그러나, 이런 지름길 모드는 적어도 아키텍처에서는 좋은 모습이 아닐겁니다.

---

## 의존성 역전

[예제로 이해하는 SOLID 설계원칙, 그리고 스프링 DI 컨테이너의 등장](https://velog.io/@msung99/%EA%B0%9D%EC%B2%B4%EC%A7%80%ED%96%A5%EC%9D%84-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B3%A0-%EB%B0%94%EB%9D%BC%EB%B3%B4%EB%8A%94-SOLID-5%EB%8C%80-%EC%84%A4%EA%B3%84%EC%9B%90%EC%B9%99) 에서 다루었던 내용이지만, 모든 객체지향은 `SOILD` 로 귀결되는듯 합니다. 클린 아키텍처와 헥사고날 아키텍처도 결국 객체지향에 기반하며, SOLID 가 빠질 수 없습니다.

### SRP 단일책임원칙

특히 아키텍처에서는 `SRP(단일 책임원칙)` 과 `DIP(의존성 역전 원칙)` 을 빼놓을 수 없습니다. SRP 단일 책임 원칙에 따라서, 특정 컴포넌트의 변경이 다른 컴포넌트에 영향을 미치는 파급력이 적어야한다는 뜻입니다. 하지만 아, 많은 코드, 특히 전통적 아키텍처 에서는 SRP 를 위반하기 때문에 시간이 갈수록 컴포넌트를 변경할 많은 이유가 쌓이게 되고, 유지.보수면에서 최악의 설계 구조를 가지게 됩니다.

### DIP 의존성 역전 원칙

또 전통적 아키텍처 에서는 계층간의 의존성 방향이 **상위계층에서 하위계층으로 향하고 있습니다.** 이는 도메인 계층이 영속성 계층을 의존하기 때문에, 영속성 계층에 변화가 일어날때마다 **도메인 계층도 매번 변경되어야 일어나야 한다**는 것입니다.

![](https://velog.velcdn.com/images/msung99/post/ca994d89-62a9-456b-9c04-1d2f61f9d596/image.png)

이 상황을 방지하도록, DIP 는 해결책을 제공합니다. 도메인 계층에 인터페이스를 도입함으로써 의존성을 역전시킬 수 있고, 그 덕분에 영속성 영속성 계층이 도메인이 계층에 의존하게 됩니다.

> DIP : 코드상의 어떤 의존성이든 그 방향을 반대로 바꿀 수 (역전시킬 수) 있다.

![](https://velog.velcdn.com/images/msung99/post/5f8b2872-b870-4739-a98c-4a046fbd310a/image.png)

반대로 위 케이스는 도메인 계층에 인터페이스를 도입함으로써 의존성을 역전시킨 경우입니다. 그 덕분에 영속성 계층이 도메인 계층에 의존하게 되죠. 이 묘수로 영속성 코드에 있는 숨막히는 의존성으로부터 도메인 로직을 해방시키게 된 것입니다.

---

## 클린 아키텍처

로버트 C. 마틴의 '클린 아키텍처' 에서는 **도메인 코드가 바깥으로 향하는 어떤 의존성도 없어야함을 강조**하고 있습니다. 대신 DIP, 즉 의존성을 역전시켜서 모든 의존성이 도메인 코드를 향하고 있게 합니다. 클린 아키텍처에서는 도메인 계층이 영속성이나 UI 같은 외부 계층과 철저히 분리돼야 하므로, **애플리케이션의 엔티티에 대한 모델을 각 계층에서 유지보수해야합니다.**

### 도메인 계층의 다른 계층과의 상호작용

가령 영속성 계층에서 ORM 프레임워크를 사용한다고 가정 해봅시다. 도메인 계층은 영속성 계층을 모르기 때문에, 도메인 계층에서 사용한 엔티티 클래스를 영속성 계층에서 함께 사용할 수 없고, 두 계층에서 각각 엔티티를 만들어야 합니다. **즉, 도메인 계층과 영속성 계층이 데이터를 주고받을 때, 두 엔티티를 서로 변환해야 한다는 뜻입니다.** 이는 도메인 코드를 프레임워크에 특화된 의존성 문제로 부터 해방시킬 수 있는 해결책이되죠.

---

## 헥사고날 아키텍처

![](https://velog.velcdn.com/images/msung99/post/4c3a2341-0f52-4fad-ac3d-4f894bbc3a58/image.png)

앞서 살펴봤던 `클린 아키텍처`는 꽤나 추상적이고 모호한 표현들이 많습니다. 이런 아키텍처를 구체화해서 설명하는 "육각형 아키텍처" 에 대해 살펴봅시다.

보면 알겠지마, [[Clean Architecture] 클린 아키텍처에서는 전통적 계층구조의 의존성 문제를 어떻게 해결했을까?](https://velog.io/@msung99/Clean-Architecture-%ED%81%B4%EB%A6%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%97%90%EC%84%9C%EB%8A%94-%EC%9D%98%EC%A1%B4%EC%84%B1-%EB%AC%B8%EC%A0%9C%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%B4%EA%B2%B0%ED%95%A0%EA%B9%8C) 에서도 다루었던 단위들이 대거 등장합니다. 다시 한번 되짚고 갑시다. 자세한 설명은 지난 포스팅을 먼저 참고하거 오시면 이해가 더 잘될겁니다.

### 엔티티 & 유즈케이스

육각형 안에는 도메인 `엔티티`와, 이와 상호작용하는 `유즈케이스`가 있습니다. 육각형에서 외부로 향하는 의존성이 없기 떄문에, 클린 아키텍처에서 제시한 `의존성 규칙`이 그대로 적용됩니다.

### 어댑터

육각형 바깥에는 애플리케이션과 상호작용하는 다양한 어댑터들이 존재합니다.
웹 브라우저와 상호작용하는 `웹 어뎁터`도 있고, 반면 반대 위치에서 DB 와 상호작용하는 어댑터도 존재합니다. 이러한 어댑터는 크게 2종류로 구분됩니다.

- Driving Adapter : 애플리케이션의 코어(도메인, 엔티티등) 을 호출하는 엔티티. 즉 웹 어댑터가 이에 해당합니다.
- Driven Adapter : 애플리케이션에 의해 주도되는 어댑터들입니다. 즉 영속성 어댑터가 이에 해당하죠.

### 포트

코어와 어댑터들 간의 통신이 가능하려면 애플리케이션 코어가 포트를 제공해야합니다. `주도하는 어댑터(driving adapter)` 에게는 그러한 포트가 코어에 있는 유스케이스 클래스 중 하나에 구현되고 어댑터에 의해 호출되는 `인터페이스`가 될 것입니다.
또 `주도되는 어댑터(driven adapter)` 에게는 그러한 포트가 어댑터에 의해 구현되고 코어에 의해 호출되는 `인터페이스`가 될 것입니다.

---

## 가독성있는 헥사고날 패키지 구성하기

당연한 말이지만, 코드를 보는 것만으로도 어떤 아키텍처인지 파악하고, 누구던지 어떤 한눈에 패키지 구조를 파악할 수 있는 구조를 지향하는게 좋을겁니다. 지금부터 헥사고날 아키텍처를 직접적으로 반영하는 표현력있는 패키지 구조를 소개하겠습니다. 그 전에 안좋게 패키지를 구성한 케이스 2가지를 먼저 살펴본후, 아키텍처를 표현력있게 살린 패키지 구조를 살펴보도록 합시다.

이를 위해, 사용자가 본인의 계좌에서 다른 계좌로 돈을 송검할 수 있는 '송금하기' 유즈케이스를 살펴보겠습니다.

### 계층별로 구성

```
Money
|-- domain
|	|- Account
|	|- Activity
|	|- AccountRepository
|	|- AccountService
|
|---persistence
|	|-- AccountRepositoryImpl
|
|---web
|	|- AccountController
```

이렇게 웹 계층, 도메인 계층, 영속성 계층 배치했습니다. DIP 원칙을 적용해서 영속석 계층의 AccountRepositoryImpl, 웹 계층의 AccountController 는 의존성이 domain 패키지의 도메인 코드만을 향하게 되어있습니다. 이때 의존성 역전을 위해 domain 패키지에는 AccountRepository 인터페이스를 위치시키고, 영속성 계층에 해당 인터페이스의 구현채로 AccountRepositoryImpl 를 배치시켰죠.

### 문제점

> 계층별로 패키지,코드를 구성하면 기능적인 측면들이 섞이기 쉽다.

이런 패키지 구조는 애플리케이션이 어떤 유스케이스들을 제공하는지 알 수 없습니다. AccountService 와 AccountController 가 어떤 유스케이스를 구현했는지 파악하기 힘들죠. **특정 기능을 찾기 위해선 어떤 서비스가 이를 구현했는지 추측해야하며, 해당 서비스 내의 어떤 메소드가 그에대한 책임을 수행하는지 찾아야합니다.** 또한 어떤 기능이 웹 어댑터에서 호출되는지, 영속성 어댑터가 도메인 계층에 어떤 기능을 제공하는지 한눈에 알아볼 수 없게됩니다.

---

### 기능별로 구성

```
Money
|--- account
	 |--- Account
	 |--- AccountController
	 |--- AccountRepository
	 |--- AccountRepositoryImpl
     |--- SendMoneyService
```

이렇게 "계좌 관련" 모든 코드를 최상위 account 패키지내에 구성하면, 사실 계층별 패키징 구성 방식보다 가시성을 훨씬 떨어뜨립니다. 어댑터를 나타내는 패키지명이 없고, 인커밍(in-coming) 포트, 아웃고잉(out-going) 포트를 확인할 수 없게됩니다.

> 기능을 기준으로 코드를 구성하면 어떤 아키텍처 기반인지 명확히 보이지 않는다.

### 헥사고날 아키텍처를 패키지에 표현하기

```
Money
|--- account
	 |--- adapter
     |	  |--- in
     |	  |	   |--- web
     |	  |.        |--- AccountController
     |	  |--- out
     	       |--- persistence
               	    |--- AccountPersistenceAdatper
                    |--- SrpingDataAccountRepository
     |---domain
     |   |--- Account
     |   |--- Activity
     |
     |--- application
     	   |--- SendMoneyService
           |--- port
           		|--- in
                |	 |--- SendMoneyUseCase
                |--- out
                	 |--- LoadAccountPort
                     |--- UpdateAccountStatePort
```

헥사고날 아키텍처에서 구조적으로 핵심적인 요소는 `엔티티`, `유스케이스`, `인커밍/아웃코잉 포트`, `인커밍/아웃고잉 어댑터` 입니다. 이 요소들을 어떻게 패키지에 녹여낼 수 있을지 살펴봅시다.

최상위에는 계좌와 관련된 유스케이스를 구현한 모듈임을 나타내는 account 패키지가 있습니다. application 패키지는 도메인을 둘러싼 서비스 계층을 포함하고있죠. SendMoneyService 는 인커밍 포트 인터페이스인 SendMoneyUseCase 를 구현하며, 아웃고잉 포트 인터페이스이자 영속성 어댑터에 의해 구현된 LoadAccountPort 와 UpdateAccountStatePort 를 사용합니다.

또 adatper 패지키는 보시듯이 web 어댑터와 persistence 어댑터를 포함하고있습니다.

### 이걸 어떻게 쓰지?

이러한 헥사고날 패키지를 사용하는 경우를 떠올려봅시다. 헥사고날 구조를 보면서 팀원들이 현재 사용중인 third party API 를 변경하는 작업에 대해 회의를 진행하는 상황이죠. 그러면 작업을 진행하는 부분을 찾기위해, 바로 아웃고잉 어댑터를 바로 뒤져보게 될겁니다. 왜냐하면 작업을 진행하고자 하는 API 코드는 adapter/out/<어댑터명> 패키지에 존재하고, 이를 바로 찾아낼 수 있기 때문이죠.

---

## 핵심은 의존성 주입 & 역전

앞서 클린 아키텍처를 언급했을떄, 애플리케이션 계층이 인커밍/아웃고잉 어댑터에 의존성을 가지면 안됩니다. 이떄 영속성 어댑터와 같은 아웃고잉 어댑터에 대해서는 제어 흐름을 반대 방향으로 의존성을 돌리기위해, `의존성 역전 원칙`을 이용해야 한다는점을 다시 되짚고 넘어갑시다.

![](https://velog.velcdn.com/images/msung99/post/21e4f036-e8f2-4203-b219-57a881e4fb06/image.png)

이를 구현하기 위해선, 애플리켄이션 계층에 인터페이스를 만들고 어댑터에 해당 인터페이스를 구현한 클래스를 두면됩니다. 헥사고날 아키텍처에서는 이 인터페이스가 포트입니다. 그러고 애플리케이션 계층은 어댑터의 기능을 실행하기 위해 이 포트 인터페이스를 호출하는 방식으로 돌아갑니다.
위 그림은 웹 컨트롤러가 서비스에 의해 구현된 인커밍 포트를 호출합니다. 서비스는 어댑터에 의해 구현된 아웃고잉 포트를 호출하고요.

---

## 마치며

다음 포스팅에서는 헥사고날 아키텍처의 어떻게 스프링부트에서 구현할지에 대해 알아보겠습니다.