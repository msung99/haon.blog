---
title: Refresh token, Access token 이란?
date: "2022-12-14"
tags:
  - JWT
  - HTTP
  - 인증/인가
---

JWT(Json Web Token) 을 통한 인증,인가 방식을 학습했다면, 바로 이어서 등장하는 이론이 바로 Refresh Token 과 Access Token 입니다. 이들은 무엇이며, 어떤 방식으로 클라이언트와 서버간에 전송이 이루어지며, 코드 구현은 어떻게 되는지 자세히 알아보겠습니다.

지난 포스팅에서 JWT 에 대해 알아봤는데, 참고하실 분들은 아래 링크를 따라서 JWT가 무엇인지에 대해서 학습하시는 것을 권장드립니다.

https://velog.io/@msung99/Spring-Security-JWT

---

## 기존 Access Token (JWT) 의 한계

![](https://velog.velcdn.com/images/msung99/post/bf417743-408f-45b6-9b66-c2dc46b7feac/image.png)

### 1. Payload 의 값을 탈취해가기 쉽다.

기존의 JWT 를 활용해서 아무리 암호화를 잘 해놓았다고 한들, 클라이언트와 서버 사이에서 토큰 기반으로 정보를 통신하는 도중에 해커에게 토큰안에 들어있는 정보를 탈취당할 위험성이 존재합니다.

Signature(서명값)은 분명 개발자가 지정해준 암호화 알고리즘(ex.HS256 알고리즘) 을 사용하더라도, 해커가 이를 악용해서 Payload 영역의 데이터를 손쉽게 얻어낼 수 있습니다.

따라서 Payload 에는 정말 중요한 정보 (ex. 계좌정보, 아이디, 비밀번호) 등을 저장해서 통신하는 방식은 권장하지 않고 있는만큼 한계점이 드러냅니다.

### 2. 한번 탈취당한 토큰은 만료기간 전까지 끝도 없이 정보가 유출된다.

또한, 기존 JWT 의 치명적인 단점은 **한 번 발급된 경우 유효기간이 지날 때까지 계속 사용할 수 있기 때문에 만약 토큰이 악의적으로 활용될 경우 토큰의 유효기간이 다 될 때까지 정보가 계속 탈취당할 수 있다**는 점입니다.

그렇다면 여기서 더 JWT 를 통한 방식에서 더 강화된 보안방식은 없는걸까요?
이때 등장한 것이 바로 Refresh Token 입니다.

---

## Refresh Token 의 등장

이러한 JWT의 문제점을, Access Token의 유효기간을 줄이고, Refresh Token이라는 새로운 토큰을 발급함으로써 해결할 수 있습니다.

기존 Access Token(JWT)를 통한 인증 방식의 문제는, 제3자에게 탈취당할 경우 유효기간이 끝날 때까지 계속 정보가 털릴 수 있다는 점이 있습니다.

그렇다고 해서 Access Token의 유효기간을 막 줄이자니, 그만큼 사용자가 로그인을 자주 해서 Token을 다시 발급받아야 하므로 여간 불편하고 귀찮은 일이 아닐 수 없습니다.

> 이런 상황에서, "유효기간을 짧게 하면서 보안을 강화할 수 있는 방법이 있지 않을까?" 라는 질문의 해답을 Refresh Token이 제공합니다.

---

## Refersh Token 이란?

![](https://velog.velcdn.com/images/msung99/post/96c38310-84cf-476a-b929-ac273a1f68eb/image.png)

Refresh Token은 Access Token과 똑같은 형태의 JWT입니다. **처음 로그인했을 때, Access Token과 동시에 발급이 되며, Access Token의 유효기간이 지났을 때 새롭게 발급해주는 역할을 합니다.**

예를 들어 Access Token의 유효기간은 1시간이고, Refresh Token의 유효기간은 3주라고 하자. 이 때에 1시간이 지나서 Access Token 이 만료되더라도, 3주가 넘어가기 전까지는(= Refresh Token이 만료되기 전까지는) 새로운 Access Token을 계속 발급받을 수 있습니다.

Access Token 과 Refesh Token 을 정리해보자면 아래와 같습니다.

> - AccessToken : resource 에 접근할 수 있는 필수적인 정보를 담은 토큰, 서버는 AccessToken을 통해 클라이언트를 식별하고 권한 유무를 판단할 수 있습니다.. 또한, 생명 주기를 가져 Expired 되면 RefreshToken을 통해 갱신해야합니다.

---

- RefreshToken : 새로운 AccessToken을 발급하기 위해 가지는 토큰

---

## Refresh Token 의 특징

Access Token의 보안 취약성은 여전히 존재하지만, 유효기간이 짧기 때문에 좀 더 안전하게 사용할 수 있게 되었습니다.

Refresh Token은 유효기간이 지나면 다시 발급받아야 하고, 이 또한 탈취의 위험성이 있기 때문에 기간을 적절하게 설정해줘야 합니다.

> - 특징1) JWT 토큰은 암호화하고자하는 데이터를 포함하여 발행할 수 있으며 정해진 만료기간이 지나면 토큰을 디코딩 할 수 없습니다.

---

- 특징2) 서비스의 중요도와 특징에 따라 Access Token, Refresh Token의 만료 기간은 상이합니다.
  - 보통 AccessToken : 30분, RefreshToken : 2주 정도의 만료기간을 가지도록 설정합니다.

---

## AccessToken, RefreshToken 의 한계점 : 서버측의 검증 로직을 통한 보안강화

그렇다면 Refresh Token 자체가 탈취당할 위험성도 있지 않을까요? 이 점은 아직 완전히 극복하지 못한 토큰의 한계점이라고 볼 수 있습니다.

Accesss Token 이 탈취당해도 만료기간 자체가 짧기 때문에 별 위험성이 없지만, Refresh Token 자체가 탈취당한다면 끝도 없이 계속 정보가 유출될겁니다.

Refresh Token 이 탈취당하면, 해당 토큰의 만료기간 전까지 Access Token 을 무한정으로 생성해서 다시 해커가 정상적인 사용자로 위장할 수 있습니다.

이를 그래도 해결하기 위한 서버측의 검증 로직을 적용할 수 있는데, **데이터베이스에 발급받은 Refresh Token 을 저장해두고 요청으로 들어오는 Refresh Token 과 DB 에 저장된 Refresh Token 을 대조.비교하며 검증하는 것입니다.**

---

## Access Token, Refresh Token 인증 과정

토큰을 통한 인증방식의 상세한 과정을 알아봅시다.

![](https://velog.velcdn.com/images/msung99/post/d4759109-af4c-4411-83aa-6a328eb90b74/image.png)

1.클라이언트에서 로그인을 요청합니다.

2.서버는 로그인 요청을 받고, Response 로 Access Token, Refresh Token 을 발급해줍니다.

3.클라이언트는 발급받은 Access Token, Refersh Token 을 별도로 Local Storage 에 저장해둡니다.

4.클라이언트에서 서버에 대한 매 요청마다 HTTP Header 에 Access Token 을 포함해서 보냅니다.

5-1. AccessToken이 유효하다면 서버는 요청을 받아들이고 그에 상응하는 Response 를 보내주면 됩니다.

5-2. AccessToken이 유효하지 않다면, 즉 AccessToken이 만료되었다면 RefreshToken을 요구하는 상태코드와 메시지를 클라이언트로 반환합니다.

6.(5-2의 경우) 클라이언트가 RefreshToken 이 필요하다는 Response 를 받게된다면, 그에 대해 서버에게 다시 요청으로 아까 local Storage 에 저장해뒀던 RefreshToken을 보내서 새로운 AccessToken 을 발급 받습니다.

- 이때 서버는 클라이언트로 RefreshToken을 검증하고 유효할 경우에 새로운 AccessToken을 발급하고 기존 요청을 처리한 후 헤더에 AccessToken과 함께 응답을 해야 합니다!

- RefreshToken 을 검증하는 과정에는 앞서 DB에 저장해놓은 RefreshToken 과 요청으로 들어온 RefreshToken 을 비교.대조해야 하고, 만료기간 또한 검증해서 유효성을 판단해야 합니다.

- RefreshToken이 동일하고 만료기간도 지나지 않았다면 새로운 Access Token을 발급해줍니다.

  7.클라이언트는 발급받은 새로운 AccessToken 으로 다시 서버에게 매 요청마다 Access Token 을 포함해서 보내면 됩니다.

---

## 마치며

이로써 Refresh Token 과 Access Token 의 특징에 대해 살펴봤습니다.
다만 코드 구현이 어떻게 이루어지는지 궁금하실텐데, 곧 바로 새로운 포스팅에서 코드 구현 내용을 다루어보겠습니다.

---

## 참고

[jwt.io](https://jwt.io)

[JSON_WEB_TOKEN 위키피디아](https://en.wikipedia.org/wiki/JSON_Web_Token)

[스택오버플로우 when_using_token_authentication](https://stackoverflow.com/questions/32060478/is-a-refresh-token-really-necessary-when-using-jwt-token-authentication)

https://velog.io/@park2348190/JWT에서-Refresh-Token은-왜-필요한가

https://kukekyakya.tistory.com/entry/Spring-boot-access-token-refresh-token-%EB%B0%9C%EA%B8%89%EB%B0%9B%EA%B8%B0jwt

https://blog.naver.com/PostView.naver?blogId=jinwoo6612&logNo=222462211251&parentCategoryNo=&categoryNo=32&viewDate=&isShowPopularPosts=true&from=search

https://inpa.tistory.com/entry/WEB-📚-Access-Token-Refresh-Token-원리-feat-JWT
