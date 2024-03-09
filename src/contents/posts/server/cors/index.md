---
title: Cors, Sop 에 대해 알아보자!
date: "2022-12-26"
tags:
  - HTTP
  - CORS
---

웹 개발을 하다보면 cors 라는 빨간 에러메시지를 접하게 되는 경우가 많습니다.
이는 보통 클라이언트와 서버 프로젝트가 분리되어 개발되고 서로 RestAPI 를 통해 통신할 때 자주 접하는 에러로 많은 분들이 혼동을 겪게 되는 부분입니다.

그러나, 이렇게 우리에게 고통을 주는 CORS 는 알고보면 오히려 클라이언트와 서버가 원활하게 통신할 수 있도록 돕고 있다는 반전이 있습니다.

이번 포스팅에서는 CORS, POS 란 무엇인지 알아보며, 이들에 대한 접근제어 시나리오(흐름 순서)에 대해 자세하게 알아보겠습니다. 또한 CORS 에 대한 에러를 처리하기 위한 방법들도 자세히 파해쳐봅시다.

---

## CORS 에러를 언제, 어떻게 접하게 될까?

이 에러는 **한 사이트에서 주소가 다른 서버로 요청을 보낼 때** 자주 접하게되는 오류입니다.

주소가 "naver.com" 이라는 웹 사이트에서 "google_search.com" 인 서비스에 API 정보를 받아오기 위해 프론트에서 HTTP 요청을 보냈을 때, 미리 어떤 설정을 해주지 않는다면 아래와 같은 CORS 에러 메시지를 접하게 됩니다.

![](https://velog.velcdn.com/images/msung99/post/b54f7f6e-2096-497b-a158-0303b948d602/image.png)

우리는 이 에러를 정확히 이해하고 해결하는 방법을 알기 위해선, 우선 출처(Origin) 란 무엇이고, SOP 라는것이 무언인지를 먼저 알아야합니다. 곧 바로 무엇인지 알아보겠습니다.

---

## 출처(Origin) 이란?

우리가 어떤 사이트를 접속할 때 인터넷 주소창에다 URL 이라는 문자열을 입력하고, 접근하게 됩니다.
이떄 URL 의 구성성분에 대해 더 자세히 알아보겠습니다.
출처(origin) 이라는 것은 이 URL 이라는 단위에 포함되어 있는 더 작은 구성성분 이기 때문입니다.

![](https://velog.velcdn.com/images/msung99/post/7bd48930-788e-46b4-9a6b-b8f2fc8e9693/image.png)

URL은 크게 6가지의 구성단위로 구분 및 구성된다고 볼 수 있습니다. 이때 핵심적인 부분은 바로 프로토콜, 호스트, 포트인데 이 3가지로 구성된 것이 바로 출처(origin) 입니다.

정리해보자면 아래와 같습니다.

> 출처(Origin) : Protocol + Host + Port

- 즉 출처란 프로토콜, 호스트, 그리고 포트 3가지를 합친 URL 을 의미한다!

---

## SOP(Same-Origin Policy)

출처(origin) 라는 개념을 이해하셨다면 바로 SOP 가 무엇인지를 알아봅시다.
SOP란 **다른 출처의 리소스를 사용하는 것을 제한하는 보안 정책**을 의미합니다.

> 동일한 출처에서만 리소스를 공유할 수 있도록하는 법률 정책

앞서 살펴봤던 origin(출처)의 구성성분인 프로토콜, 호스트, 포트를 통해 같은 출처인지 다른 출처인지를 판단할 수 있습니다. 즉 이 3가지 중에 하나라도 다르다면 다른 출처라고 판단하는 것이며, 반대로 이 3가지가 모두 같아야지만 같은 출처(Same Origin) 이라고 말하는 것입니다.

- 동일 출처(same origin) 서버에 있는 리소스는 자유롭게 가져올 수 있지만, 다른 출처(Cross origin) 서버에 있는 이미지나 데이터 같은 리소스는 상호작용이 불가능하다는 것입니다.

---

## SOP 는 왜 필요한가?

예를들어 페이스북을 사용하는 유저(클라이언트)가 있다고 해봅시다.

> 요약

- 어떤 요청에 대한 출처(origin) 가 동일한 출처(same-origin)로 부터 왔다면 SOP 정책을 지켰다고 판단하고 해당 요청을 수락한다.

---

- 해커가 심은 홈페이지 url 과 같은 다른 출처(cross-origin) 으로 부터 왔다면, SOP 정책에 위반한 것이라 판단하고 해당 요청을 거부하고 에러 메시지를 터뜨린다.

1. 이 클라이언트가 페이스북 사이트에 원하는 리소스를 제공받기 위해 요청을 보낼겁니다.

![](https://velog.velcdn.com/images/msung99/post/a61d93a9-0b65-4c00-8aae-fad89c8cc1a0/image.png)

2. 이떄 유저는 페이스북 서비스에 로그인을 시도하고, 페이스북에서 인증(Authentication) 토큰을 받아옵니다.

3. 사용자는 발급받은 인증 토큰을 페이스북에 매번 요청을 보낼때마다 실어서 보낼겁니다.

4. 그러던 중, 해커는 해당 사용자가 혼동할만한, 진짜 흥미롭게 생긴 내용이 실린 링크를 사용자에게 악의를 품고 메일을 통해서 보냅니다.

5. 만일 사용자가 해커가 보낸 해당 링크에 유혹되버려서 클릭을 해버린다면, 정상적인 페이스북 주소 www.facebook.com 가 아닌 해커가 만든 악의적인 주소 www.hacker.com 으로 이동해버리게 됩니다.

6. 즉, 해커가 만든 사이트의 HTML, CSS, JS 가 사용자의 브라우저가 다운로드가 되고 실행되면서, 사용자는 의도치않게 해커가 만든 주소에다 토큰 정보를 요청을 보내버릴 수도 있으며, 의도하지 않게 금융정보나 개인정보가 털리게 될 수 있습니다.

- 이렇게 될때, 여기서 **SOP 가 의도치 않은 악의적인 URL 로 사용자의 원하는 정보를 보내지 않도록 브라우저에서 막아버릴 수 있게 합니다.**

7. 그렇다면 페이스북 입장에서는, 이 요청이 어디로부터 온가지? 라고 **요청이 들어온 출처(origin)을 확인**을 합니다.

8. 이 요청을 확인해보니 www.hacker.com 으로 부터 온 것입니다. **그러면 페이스북 입장에서는 자기 출처와 다른 것이니 요청을 받은 Origin (출처)는 다른 것이라! 라고 인식합니다.**

9. 즉, **Cross Origin 으로 판단하기 때문에 SOP 에 위반된다라고 판단하고 해당 요청을 거부합니다.**

---

## CORS : 다른 출처에 대한 리소스가 필요한 경우

그렇다면 다른 출처에서 원하는 리소스에 접근하는 행위는 SOP 에 위반되는 것인데, 다른 출처에서 접근할 수 있는 방법은 없을까요?

백엔드에서 개발한 API 와 리소스들을 프론트에서 접근할때 다른 출처(cross-origin) 라고해서 접근이 아예 안된다면, 이건 답이 없을겁니다.

이에 대한 정답은 CORS 에 있습니다. 초반부에 설명드렸듯이 CORS 는 오히려 우리를 돕고 있다는 사실이 있다고 했었죠?

> CORS 란? : 다른 출처의 자원을 공유하는 방식

- 저희가 다른 출처(cross-origin) 에서 원하는 리소스에 접근하는 것은 원칙적으로는 SOP 에 위반되지만, 일부적으로 특정 출처에 대해서만 개방을 해서 리소스에 접근 가능하도록 하는 방식입니다.

By MOZILLA 인용

- 교차 출처 리소스 공유(Cross-Origin Resource Sharing, CORS) 는 추가 HTTP 헤더를 사용하여, 한 출처에서 실행중인 웹 애플리케이션이 다른 출처의 선택한 자원에 접근할 수 있는 권한을 부여하도록 브라우저에 알려주는 체제입니다.

---

### 시빨간 CORS 에러 메시지는 무슨 의미였는가?

![](https://velog.velcdn.com/images/msung99/post/7ed57e48-49b5-4ece-af22-44805a37c285/image.png)

- CORS 에 위반되는 출처이니까 이러한 에러 메시지가 뜨는 것이겠죠?

- 즉, 이 메시지는 CORS 방식에 따라 허용된 다른 출처(cross-origin) 들이 있을텐데, 이렇게 **허용된 다른 출처(cross-origin)들 중에 해당 출처가 해당되지 않아서 SOP 를 위반했다고 뜨는 에러 메시지입니다.**

---

## CORS 접근제어 시나리오

이제 CORS 에 대해 더 자세히 파해쳐봅시다. CORS 접근제어 시나리오 에는 총 3가지가 존재합니다.

> - 단순요청(Simple Request)

- 프리플라이트 요청(Preflight Request)
- 인증정보 포함 요청(Credentialed Request)

---

## Preflight Request

쉽게 말해, 사전확인 작업입니다.

예를들어 친구집에 놀러가능 경우를 생각해봅시다. 친구에게 너희집 놀러가도 되니? 물어보는 것이고, 친구는 응답으로 어 놀러와! 또는 놀러오지마! 라고 해주는 것입니다.
그 친구의 응답에 따라서 본인은 놀러갈지 안놀러갈지 정하는 방식입니다.

- **Preflight 는 본격적인 본 요청을 보내기전에 일단 서버한테 물어보는 것입니다.** 서버는 요청에 대해 요청 보내도 된다~ 또는 안된다 라고 응답해줍니다.

---

## Preflight Request 과정

![](https://velog.velcdn.com/images/msung99/post/1f00b5e1-2b9b-4620-b9ec-6699731c1878/image.png)

> - 1.  클라이언트에서 OPTIONS 메소드를 통해 다른 도메인의 리소스에 요청이 가능한지 확인 작업을 합니다.

- 2. 요청이 가능하다면 클라이언트는 실제 요청(Actual Request) 을 보냅니다.

앞서 친구집 놀러가는 예시와 동일한 원리입니다.

1. Preflight Request : 본 요청(실제 요청. actual request) 를 보내기전에, 일단 서버에게 OPTIONS 메소드를 통해 물어보는 것입니다.

- 또한 이렇게 사전질문을 하는 것을 OPTIONS 를 통해서 물어볼 수 있습니다.

2. Preflight Response : 사전질문에 대해 서버에서 응답을 해줍니다. 즉, 서버는 그 요청을 받아들일 수 있다고 클라이언트에게 의사를 전달하는 것이죠.

- **만일 클라이언트가 보낸 요청이 거부된다면 클라이언트에서 Actual Request 는 실제로 보내지는 않습니다.** 그런데 보내도 된다고 이야기하면 실제로 보내지는 것입니다.

3. Actual Request + Actual Response : 본 요청과 응답입니다.

---

## Preflight Request 포맷

사전 요청(Preflight Request) 를 할때 물어볼 것들이 있습니다. 그리고 그것에 맞는 포맷이 있다.

![](https://velog.velcdn.com/images/msung99/post/8e4e7803-7c61-43fa-9b49-1f7e6391b1ce/image.png)

- Origin : Header 에는 Origin 이 들어있어야한다. 즉, 이 요청은 어디로부터 날라온 것이야! 라고 출처를 표현을 해주는 것이다.

- Access-Control-Request-Method : 실제 요청의 메소드, 즉 나는 이 메소드를 보낼건데, 이 메소드를 보내도 되겠니? 라고 물어볼 정보를 담는 것입니다.

- Access-Control-Request-Headers : 실제 요청의 추가 헤더로 어떤 것들을 더 보낼 수 있는지라고 물어보는 요청입니다.

---

## Preflight Response 포맷

![](https://velog.velcdn.com/images/msung99/post/252139da-7930-46be-a426-56975d8fa489/image.png)

- Access-Control-Allow-Origin : 서버측에서는 이 Origin 은 허가가 되어있어! 라고 응답해주는 것입니다.

- Access-Control-Allow-Methods : 서버 측에서는 이러한 메소드들이 허가가 되어있어! 라는 것입니다.
- Access-Control-Allow-Headers : 서버 측에서는 이러한 헤더들이 허가가 되어있어! 라는 것입니다.

- Access-Control-Max-Age : Prelflight 응답 캐시 기간을 의미합니다.

### 캐시 기간이란? 🧐

Preflight 요청을 보내게되면 실질적으로 2번 요청(사전 요청, 실제 요청)이 보내질텐데, 이렇게 되면 매번 하나의 요청을 보낼때마다 2번의 요청이 왔다갔다 한다는 것이겠죠?

이러면 굉장히 리소스 측면에서 좋지는 않을겁니다. 그렇기 떄문에 이 Preflight 응답에 대해서 브라우저는 캐싱을 해두고, 다음 똑같은 요청을 보낼때 Preflight 캐싱된것을 확인하고 Preflight 사전 요청을 미리 보내지 않고, 바로 본 요청을 보내게 되는 것입니다.

그래서 Access-Control-Max-Age 를 설정하면 위 예제의 경우 86400초를 캐싱(저장)을 해두는 명령이 됩니다.

---

## Simple Request 란?

앞서 알아본 Preflight Request 에서 사전 요청&응답 과정을 제거하고 **본 요청&응답 (Actual Request + Actual Response) 만 남긴것**입니다.

> Prelight 과 다르게, Prelight 요청(사전요청) 없이 바로 요청을 날리는 절차

---

## Simple Request 조건

Simple Request 를 날리려면 다음 조건들을 만족해야 합니다.

> - 1. GET, POST, HEAD 메소드 중에 하나여야한다.

---

2. Content-Type 은 다음 3가지중에 하나여야 한다.

- application/x-www-formp-urlencoded
- multipart/form-data
- text/plain

---

3. 헤더는 Accept, Accept-Language, Content-Language, Content-Type 만 허용된다.

---

## Simple Request 과정

![](https://velog.velcdn.com/images/msung99/post/46e52211-4a31-404d-9203-89d508a1a7e0/image.png)

> - 1.  클라이언트가 Server-b.com 라는 출처(origin) 에서 보내는 것이라고 보냅니다.

---

- 2. 서버에서는 전달받은 Origin 을 확인합니다. 그런데 위 예제의 경우 허용된 출처가 와일드카드(별표 \*) 로 명시되어 있습니다.

---

- 3. 와일드카드는 모든 출처에 대해 허용하겠다는 의미입니다. 따라서 전달받은 해당 출처에 대해 리소스를 제공하도록 허용해줍니다. (정상적인 응답을 해줍니다)

그런데 만일 Access-Control-Allow-Origin 이 별표 \* 가 아니라 foo.hi 만 명시되어 있는 경우, Origin 이 foo.example 인 곳에서 요청을 보내면 Cross-Origin 에러가 터질겁니다.

이 점을 기억하고 계시길 바라며, 이에 대한 내용은 바로 아래에서 계속 이어서 설명하겠습니다.

---

## Preflight Request 는 왜 필요할까? 언제쓰이지?

위와 같은 의문이 당연히 생길 수 있습니다.
Simple Request 를 보내면 그냥 딱 한번 요청을 보내고 끝나는 간단한 방식일텐데, 왜 Preflight 로 굳이 2번 왔다갔다를 해야할까요?

이 정답은 **CORS를 모르는 출처를 위해서입니다.**

![](https://velog.velcdn.com/images/msung99/post/74b7d737-6d01-4902-8793-6097dc2f8707/image.png)

위 그림은 서버가 CORS 를 모르는 서버, 즉 CORS 에 관해 아무런 설정도 없는 서버입니다.

클라이언트에서 Actual Request, 즉 Preflight 요청 없이 바로 본 요청을 보낼 때 어떤 오류가 생기는 것인지 보는 것입니다.

### 단순한 GET, POST 요청을 보냈다면?

만일 단순한 GET 요청을 클라이언트가 보낸경우, 서버는 브라우저를 통해 받은 Origin 을 확인하는데, 해당 서버는 별도의 CORS 를 설정해주지 않았기 때문에 클라이언트에게 CORS 에러메시지를 던져주면 끝입니다.

### 중요한 요청 : PUT, DELETE 요청을 보냈다면?

그러나 DELETE 요청을 보낸다면, **서버는 DB에 있는 소중한 데이터를 삭제하고 나서 CORS 에러 메시지를 리턴하는 방식입니다.**

이러면 CORS 에러 메시지를 내뱉어서 겉보기에는 DB에 데이터가 삭제되는 현상이 방지된것 처럼 보여도, **실제로는 DB의 데이터가 삭제되고 CORS 메시지가 터진 것이라서 문제가 발생한다.**

![](https://velog.velcdn.com/images/msung99/post/f7a356a5-ee3c-4fc7-a05c-e31e371583b4/image.png)

이 떄문에 Preflight 가 필요한것입니다. Prelight 요청을 통해 사전에 요청을 보내고 받은 Response 로 CORS 에러가 터졌다고 메시지를 받으면 클라이언트는 Actual Request 를 보내지 않습니다. 이에따라 서버는 DB 에 있는 데이터들을 안전하게 보관할 수 있는 것이다.

> 즉, Prelight 요청은 CORS 를 모르는 서버를 위한 필요한 작업이라고 보면됩니다.

- 이러한 이유로 GET, POST 요청의 경우 Simple Request 가 수행되며,
  PUT, DELETE 의 경우 Preflight Request 가 수행됩니다.

---

## Credentialed Request

> 인증 관련 헤더를 포함할 떄 사용하는 요청입니다.

- 쿠키, JWT 등을 클라이언트에서 자동으로 담아서 보내고 싶을때, 클라이언트에서 credentials 를 include 하게되면 서버측에 전달이 됩니다.

### 서버측 설정 및 셋팅 방법

중요한것은 서버측에서 설정을 해줘야합니다.

- Access-Control-Allow-Credentials : true 로 설정해줘야합니다. 그래야지만 클라이언트 측에서 보낸것을 받을 수 있습니다.

- Access-Control-Allow-Credentials 를 true 로 두는 순간부터, Access-Control-Allow-Origin 을 별표 \* 로 설정해두면 안됩니다.

(모든 출처를 허용하면 안된다)
만일 허용하는 순간 에러가 터집니다. 따라서 정확한 출처(Origin) 을 줘야한다.

---

## CORS 해결하기!

#### 1. 프론트 프록시 서버 설정(개발 환경)

프론트 프록시 서버 설정을 조금 바꿔주는 방식입니다. 그러나 서버측에서 충분히 설정이 가능하기 때문에, 굳이 프론트 영역에서 이를 처리해야 하는 경우는 드뭅니다. 중요한 내용은 아니므로 자세한 설명은 생략하겠습니다.

#### 2. 직접 헤더에 설정해주기

HTTP Header 의 정보를 직접 건들여서 설정해주는 방식이나, 서버 프로그래머 입장에서는 이 방식보다는 스프링부트와 같은 프레임워크를 활용해서 처리하는 방식이 더 트랜디합니다. 이 또한 자세한 설명은 생략하겠습니다.

#### 3. 스프링 부트를 이용하기

Controller 에 @CrossOrigin 어노테이션을 붙여주면 됩니다.

origin 속성에다 출처(origin) 을 설정해주면 된다. 만약 이 origin 을 별도로 설정안해주면 디폴트값으로 별표 \* 가 설정되어서 모든 출처를 다 받아버리게 됩니다.

![](https://velog.velcdn.com/images/msung99/post/ef5a0da1-bec5-4161-ba1c-77092721fe84/image.png)

그런데 위 방법은 모든 Controller 에 대해서 @CrossOrigin 어노테이션을 붙어야하는 방식이다. 이를 전역적으로 한방에 처리하는 방식은 아래와 같습니다.

![](https://velog.velcdn.com/images/msung99/post/c873b234-d35a-4586-ac0b-b5aab4e24ad8/image.png)

위처럼 Configuration 클래스를 새롭게 따로 하나 만들고, 해당 클래스가 WebMvcConfigurer 인터페이스를 implements 하도록 합니다. 그리고 CORS 설정을 여기서 따로 해주면 됩니다.

---

## 마치며

지금까지 저희를 그 동안 괴롭혔던 CORS 에 정체에 대해 자세히 알아봤습니다. 다소 긴 포스팅 내용이였으나, 꼼꼼히 다시 읽어보시길 바라며 이해가 잘 안가시는 분이 있다면 댓글로 남겨주세요!

---

## 참고

https://developer.mozilla.org/ko/docs/Web/HTTP/CORS
https://studyandwrite.tistory.com/374
https://lovon.tistory.com/156
https://www.youtube.com/watch?v=-2TgkKYmJt4&t=513s
