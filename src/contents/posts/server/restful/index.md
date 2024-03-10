---
title: Restful 한 API 설계원칙에 대해
date: "2023-02-27"
tags:
  - HTTP
  - Restful
---

## 시작에 앞서 : 왜 학습을 진행하게 되었는가?

소규모 프로젝트르 진행하면서, 프론트 팀원와 제가 만든 API를 axios 를 연동하던 중에 API 가 Restful 하지 않다라는 피드백이 있었습니다. 제가 지금까지 만든 API 들은 모두 REST API 한 인줄 알았으나, 오해하고 있었던 것입니다.

이번 기회에 RESTful 한 API 에 대해서 다시 학습을 진행해보고자 이렇게 포스팅을 다루게 되었습니다.

---

## REST의 의미

어떻게 하면 RESTful 하게 자원을 명시하고 주고받는 방법을 API 로써 구현할 수 있을까요? 이를 위해, 저희는 다시 REST 의 의미에 대해 되짚고 갈 필요가 있습니다.

REST(Representational State Transfer) 란 서버와 클라이언트간의 통신방식 중 하나로, **자원의 이름을 구분하고 자원의 상태를 주고받는 통신 방식**입니다.
즉, 클라이언트와 서버가 데이터를 주고받는 방식에 대해 정리한 원칙들이 있고, 그 원칙을 기반으로하는 아키텍처 스타일을 REST 라고 하는 것이죠.

REST 는 다음과 같은 2가지 특징을 지닙니다.

> - 자원을 이름을 구분하고,

- 자원의 상태를 주고받는다.

---

## URI 에 리소스를 표현하기

저희는 아래와 같은 URI 만 보고도 과정들 중에 프론트엔드에 대한 정보, 백엔드에 대한 정보, 프론트엔드 과정에 있는 인원들 중에 연락처 정보라는것을 어느정도 예측할 수 있습니다.

이처럼 리소스를 URI 에 표현해서, 주고받을 정보에 대해 어느정도 예측을 할 수 있는 것이죠.

```java
/course/front       // 프론트엔드에 대한 정보
/course/back        // 백엔드에 대한 정보
/course/front/people/phone     // 프론트엔드 과정에 있는 인원들 중에 연락처 정보
```

---

## Collection, Document

그러면 REST API 에서 URI 는 어떤 구조를 가질까요? 이 URI 의 구조는 크게 Collection, Document 라는 단위로 나뉘어집니다.
예를들어 아래와 테이블(데이터베이스) 객체를 생성하는 API 를 개발하고 싶을때, URI 어떻게 생성할까요?

![](https://velog.velcdn.com/images/msung99/post/dfd74965-8e26-4e89-a31c-f23d0c0e2ccf/image.png)

그것은 바로 앞서 살펴본 URI 의 형태로 정의하면됩니다. 그리고 그 URI 는 Collection 과 Document 라는 단위로 구성되는 것이죠.

```java
/course/front       // 프론트엔드에 대한 정보
/course/back        // 백엔드에 대한 정보
/course/front/people/phone     // 프론트엔드 과정에 있는 인원들 중에 연락처 정보
```

이때 테이블 전체에 해당하는 부분을 Collection, 행 하나의 부분 혹은 객체를 Document 라고 합니다.

![](https://velog.velcdn.com/images/msung99/post/4763c55d-2c97-44e0-ad43-88d328532441/image.png)

- Collection 은 일반적으로 객체들의 집합이기 때문에 복수명사를 사용합니다.
- 또 Document는 이 집합들 중 객체를 구분할 수 있는 값을 의미하죠. 보통은 id 컬럼을 많이 사용합니다. (여기서는 title 컬럼을 Document 로 사용했습니다.)

이러한 데이터베이스 테이블의 컬럼 및 객체 단위들을 Collection, Document 라고하며 URI 는 이러한 Collection 과 Document 의 조합으로 이루어져 있습니다.

```java
/course/front   // => "course" 부분이 Collection
/course/back
/course/front/people/phone   // "front", "back" 부분이 Document
```

---

## 1. 리소스를 이름으로 구분하기

### URI

이제 본격적으로 REST 로 자원을 표현하는 방법에 대해 알아봅시다. REST 에서는 자원을 표현할때 URI 라는 방식으로 표현하죠? URI 는 REST 에서 자원을 구분하고 처리하기 위해 사용되며 URI 를 잘 네이밍할수록 API 가 직관적이고 사용하기 쉽습니다.

```java
/books
/customers
```

위 예시처럼 URI 가 명시되어 있다면, 이게 책에 관한 API 이구나, 또는 이게 고객에 관한 API 이구나라고 쉽게 식별할 수 있습니다.

### Singleton and Collction Resources

다음으로 URI 는 Singleton 이나 Collection 으로 표현한다는 것입니다.
Singleton 이란 /customer 와 같이 단수로 표현된 자원을 Singleton 이라고하고, Collection 은 /customers 와 같이 복수로 표현된 자원을 의미합니다.

```java
/customer    // Singleton
/customers   // Collection
```

### Collection and Sub-collection Resources

또 URI 는 Sub-Collection 을 포함할 수 있습니다. 만일 특정 고객의 계좌를 찾는 API 를 설계하고 싶다면 /customers 하위에 accounts 라는 또 다른 collection 을 두어서, 특정 고객의 계좌를 명시할 수 있습니다.

```java
/customers/{customerIdx}/accounts
```

---

## URI 네이밍 규칙

지금부터 URI 네이밍 규칙에 대해 알아봅시다.

### 1. 명사를 사용하자

첫번째로 명사를 사용해서 자원을 표현합시다. 예를들어 사람들에 대한 정보를 표현하고 싶다면 /people 이라고 표현해서 표현하면 됩니다.

```java
/people
```

몰론 예외적으로 명사외에 동사를 허용하는 경우가 있는데, 바로 컨트롤러 역할을 하는 경우입니다. 예를들어 /game/play 에 접근하면 게임이 시작되는 URI 가 있다고하면 이것은 게임의 시작여부를 컨트롤하는 URI 이므로, 이를 동사 play 로 표현할 수 있는 것입니다.

```java
/game/play
```

---

### 2. 계층관계를 구분짓기 위해 슬래시 / 를 사용하자

다음으로 자원간에 계층관계를 표현하기 위해서 / (슬래시) 를 사용합시다.
예를들어 상품 중에 3번 상품을 보여주고 싶은경우, /products/3 이렇게 표현할 수 있습니다.

```java
/products/3
```

---

### 3. URI 마지막에 슬래시를 붙이지말자

말그대로 입니다. URI 마지막에 슬래시를 붙이지맙시다.

```java
/products      // 올바른 표현
/products/     // 잘못된 표현
```

---

### 4. 하이픈 - 기호를 사용해 가독성을 높이자

다음으로 하이폰 (-) 기호를 사용해서 URI 의 가독성을 높일 수 있습니다. 아래처럼 무식하게 일렬로 나열하는 방식은 좋지 않습니다. 또 카멜 케이스를 사용하는 것도 가독성에 있어서 조금 아쉽죠. 맨 마지막에 하이픈 (-) 기호를 붙인 URI 와 비교해보면 훨씬 가독성이 좋아졌습니다.

```java
/profilemanagement   // 그냥 일렬로 나열한 방식
/profileManagement   // 카멜 케이스를 사용한 방식
/profile-management  // 하이픈 기호를 사용한 방식
```

---

### 5. 언더스코어를 사용하지 말자

또 URI 는 가급적 언더스코어, 즉 밑줄( \_ ) 을 사용하지 맙시다. 왜냐하면 일부 브라우저나 화면에서 글꼴에 따라 언더스크어 문자가 가려지거나 숨겨질 수 있기 때문입니다.

따라서 /backend_people 이렇게 표현하기보다는 /people/backend 이렇게 표현하는 것이 더 좋습니다.

```java
/backend_people   // X
/people/backend   // O
```

---

### 6. 소문자만을 사용하자

URI 는 또 대문자가 아닌, 소문자만을 사용해야합니다.

```java
/PLAYERS     // X
/players.    // O
```

---

## 2. HTTP 메소드를 활용하기

다음으로는 HTTP 메소드를 어떻게 활용하면 좋을지에 대해 알아봅시다. 만약에 유저 리스트를 받아오고 싶다면 어떻게 할까요? 아까 말했던 URI 네이밍 규칙에서는 CRUD 함수의 이름을 URI 에 사용하지 말라고 했었습니다.
그렇다면 /getUsers 나, 아니면 유저 리스트에 등록하고 싶을때 /postUsers 라는걸 사용해선 안되겠죠?

이를 해결하도록 HTTP 메소드(GET, POST, PUT, PATCH, DELETE) 등을 사용하면 됩니다.

```java
/users + GET 메소드   // 유저 리스트를 얻어오고 싶은경우
/users + POST 메소드  // 유저 리스트에 신규 유저를 등록하고 싶은경우
/users + PUT, PATCH 메소드  // 유저 리스트를 수정하고 싶은경우
/users + DELETE 메소드    // 유저 리스트에서 특정 유저를 제거하고 싶은경우
```

---

## 표현의 어려움

하지만 이러한 4가지 방식만으로, URI 만으로 모든거을 표현하는데는 어려움이있습니다. 예를들어 로그인과 로그아웃이 있는데, 로그인을 하는거니까 Collection 을 유저로 사용하면 되나? 그리고 아이디와 패스워드가 필요하니까 이런 내용을 body 에 표현해서 POST 요청을 보내면 된다? 라는 생각을 했었는데 이러한 표현은 꼭 회원을 추가하는 회원가입처럼 보이더라구요.

그래서 이 부분은 /login, /logout 으로 예외적으로 처리했던 기억이납니다.
그러면 저의 API 를 틀린것일까요? REST API 의 구조에 어긋나기 때문에 동작하지 않을까요?

초반부에 말했던것처럼 REST는 아키텍처 스타일이다. 그렇기 때문에 **REST 의 모든 원칙들을 지키지 않는다고 해서 API 가 틀린것은 아닙니다.** 이번 포스팅을 준비하면서 REST 에 대해 찾아보면서 처음에 말했던것처럼, 이건 RESTful 하지않아, 이건 Restful 이 아니야 같은 RESTful 에 대한 논의를 많이 볼 수 있었죠. 몰론 REST 에는 명확한 원칙이 있고 이를 모두 준수한다면 좋겠지만 그게 조금 어렵다는 것입니다.

REST 의 원칙을 지키기 위해서 고민하는 것은 몰론 좋은 고민일것이에요. 하지만 저희처럼 공부하는 단계에서는 REST 아키텍처의 장점을 활용하면서 API 를 설계하는 연습을 하는것도 충분힐 좋은 경험이 될 것이라고 생각합니다.

---

## 마치며

지금까지 RESTful 한 API, 즉 REST API 를 어떻게 설계할지에 대해 알아봤습니다. REST 라는것이 말씀드렸듯이, REST 의 모든 원칙들을 지키지 않는다고 해서 API 가 틀린것은 아닙니다. 따라서 API 설계를 할때 반드시 지킬 필요는 없으나, 아키텍처를 학습하는 입장에서는 충분히 장점을 활용해보면서 API 를 설계해보는 연습을 해봅시다!
