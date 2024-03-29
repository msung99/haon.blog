---
title: 웹소켓과 HTTP Polling 에 대해 알아보자!
date: "2023-01-14"
tags:
  - HTTP
  - STOMP
  - Web Socket
previewImage: server.png
---

## 웹소켓(Web Socket) 이란

웹소켓은 웹 어플리케이션을 위한 양방향 통신기법으로, 실시간성을 보장할 수 있는 방식입니다. 따라서 실시간성을 보장하는 서비스, 예를들어 게임, 체팅, 실시간 주석 차트, 가상화폐 거래소등에서 활용이됩니다.

- 웹소켓 프로토콜은 웹 브라우저와 웹 서버간의 통신을 허용하는 프로토콜입니다.
- 또 HTTP 통신과의 차이점 : HTTP 는 클라이언트가 서버에 요청하는 것이지만, 웹소켓은 서버와 클라이언트간에 "양방향 요청" 이 가능하다는 것입니다.

---

## HTTP Polling, Long Polling, Streaming

사실 HTTP 프로토콜에 대해 잘 파악하고 계신 분이라면 HTTP 방식으로도 실시간성을 보장하는 기법이 존재한다는 것을 알고 계실겁니다. HTTP 와 같은 단방향 프로토콜로, 제한된 웹 환경에서 웹 브라우저와 서버 사이의 양방향 실시간 통신을 위한 다양한 위회 기법들이 존재합니다. 그들은 비교.분석 해보겠습니다.

### HTTP Polling

![](https://velog.velcdn.com/images/msung99/post/0237d8d2-518d-493e-8d13-6b81f7947802/image.png)

Polling 은 웹 브라우저가 주기적으로 서버에게 이벤트가 발생했는지 확인하는 방식입니다. 만일 이벤트가 발생하지 않았다면 Response 에는 이벤트 정보가 포함되지 않고, 반대로 이벤트가 발생했다면 포함되는 방식입니다.

다만 **주기적으로 서버에게 이벤트 발생여부를 확인하는 방식이므로 실시간성이 떨어지는 단점이 있으며,** 주기적인 요청/응답이 오가기 때문에 계속 트래픽이 발생한다는 문제도 있습니다.

### Long Polling

![](https://velog.velcdn.com/images/msung99/post/f859f2ad-cad2-49ce-9331-9ad3cf321f82/image.png)

Long Polling 은 기존 Polling 의 실시간성을 보완한 기법입니다. 웹 브라우저가 요청을 전송할때 이벤트가 발생하기 전까지는 Response 를 보내지 않고, **이벤트가 발생할때만 Response 를 이벤트 정보와 함께 담아서 보내는 방식입니다.**

실시간성을 보완한 좋은 방식이 되었지만, 그러나 서버의 이벤트가 자주 발생하지 않는 환경에서 이용하는 것이 좋습니다. 서버의 이벤트가 자주 발생하면 비효율적인 트레픽이 발생할 수 있기 때문이죠.

## Server-sent Events

![](https://velog.velcdn.com/images/msung99/post/15320e10-a5c9-466b-82a8-1767303f6072/image.png)

마지막으로 Server-sent Events 기법은 유추할 수 있듯이, 클라이언트의 요청은 없이 **서버에서 클라이언트에게 단방향으로 이벤트를 전송하는 기법입니다.** 즉, 클라이언트에서 서버로는 이벤트를 전송할 수는 없는 방식입니다.
또 클라이언트는 서버에게 특정 이벤트를 구독하는(Subscribe) 요청을 전송합니다. 이후 서버는 해당 이벤트가 발생시 웹 브라우저에게 해당 이벤트를 전송합니다.

---

## 웹소켓 vs HTTP : 실시간성에서 어떤기법이 더 유리한가?

![](https://velog.velcdn.com/images/msung99/post/67bf9bde-a5c9-4a7f-be83-ccfd207626fc/image.png)

HTTP 방식과의 차이점을 다시 간단히 짚고 넘어갈 필요가 있습니다. 정리해보자자면 아래와 같습니다.

> HTTP

- 비 연결성(Connection less)
- 매번 연결을 맺고 끊는 과정의 비용이 많이듭니다.
- Request - Response 의 구조를 지닙니다.

---

Web Socket

- 연결지향적인 특징을 지닙니다.
- 한번 연결을 맺은 뒤 계속 유지되는 실시간성을 보장합니다.
- 양방향 통신이라는 특징을 지닙니다.

- 1.  HTTP는 클라이언트가 원하는 어떤 결과를 얻고자한다면 항상 서버에 요청을 보내야하지만, 웹소켓은 연결이 계속 유지되고 있는 상태이므로 **클라이언트가 보낸 메시지를 서버는 그냥 듣고있기만 하면 됩니다.**

- 2. **HTTP 에 비해 웹소켓이 보내야하는 메시지, 데이터 양이 훨씬 적습니다.**
     HTTP 요청을 보낼시 Request URL, 상태코드, Request&Response 헤더와 바디, .. 등의 데이터 양이 매번 요청으로 만들어져서 서버로 보내진다면 실시간성을 요구하는 서비스에서는 꽤 큰 부담이 생길것입니다.

- 3. 웹 소켓을 사용할때 처음 HandShake를 하는 과정은 HTTP 프로토콜을 통해 진행하겠지만, **한번 연결이 수립된 후로는 간단한 메시지만 오가는 방식입니다.**

> 따라서 앞서 살펴본 HTTP Polling 과 같은 방식으로 실시간성을 보장하는 서비스에 활용하는 것은 그리 좋은 방법은 아닐겁니다. 웹소켓이 아무리 보더라도 실시간 통신에 있어서 더 유리한 점이 많기 때문입니다.

---

## STOMP는 왜 써야할까?

**웹소켓은** 기본적으로 텍스트와 바이너라 타입의 메시지만을 양방향으로 주고받을 수 있는 프로토콜이라고 했습니다. 그러나, 그 메시지를 **어떤식으로 주고받을지는 사실 따로 정해진 것이 없습니다.**

그런데 프로젝트 투입 인원이 많을수록, 클라이언트와 서버가 어떤 형식으로 메시지를 주고받으며, 타입을 어떠하며, 그 메시지의 본문과 설정정보와 같은 데이터들을 어떻게 구분할지를 따로 정의해줘야합니다. 별도로 정하지 않는다면 꽤 혼동스러울 겁니다.

사용할시의 장점을 정리해보자면 다음과 같습니다.

### STOMP 사용시 장점

> - 메시징 프로토콜과 메시징 형식을 개발할 필요가 없습니다. (즉, 하위 프로토콜과 메시지 컨벤션을 정의할 필요가 없는 것입니다!)

- 연결 주소마다 새로운 핸들러를 구현하고 설정해줄 필요가 없습니다.
- 메시지 브로커를 사용하면 구독을 관리하고 메시지를 Broadcast 하는데 사용할 수 있습니다.
- 외부 Messaging Queue 를 사용할 수 있습니다. (RabbitMQ, Kafka, ... )

> STOMP 를 사용하면 형식을 고민하고, 파싱하는 코드를 구현할 필요도 없어진다!

---

## STOMP Frame

```
COMMAND
header1:value1
header2:value2

Body^@
```

- STOMP 를 사용하면 고민할 필요가 없어진다고 했었죠? 위처럼 STOMP는 COMMAND, header, Body 라는 형식으로 골격을 정의해두었습니다.

![](https://velog.velcdn.com/images/msung99/post/f753f68c-64a0-4200-a84f-29cdda950c4b/image.png)

위 그림에서 왼쪽은 순수 웹소켓만 사용했을 때이고, 오른쪽이 STOMP를 사용했을 때입니다. 웹소캣만 사용했을 때는 서버에서 보는, 그냥 날 것의 메시지만 오고가는 반면에, STOMP 를 사용했을때는 커맨드, 헤더, 바디의 형태로 메시지가 오고가는 것을 볼 수 있습니다.

---

## STOMP 기반의 통신흐름

![](https://velog.velcdn.com/images/msung99/post/92ffa347-037a-498a-abd8-c73b181af004/image.png)

스프링이 STOMP를 사용하고 있을떄의 동작 흐름을 살펴봅시다. 왼쪽을 보면 메시지를 보내는 발신자와, 메시지를 받고자하는 구독자가 있습니다. 발신자는 이 구독자들에게 메시지를 보내고 싶어하고, 구독자들은 이 "/topic" 이라는 경로를 구독하고 있다고 가정해봅시다.

이 상황에서 발신자는 바로 "/topic" 이라는 경로를 통해서 "/topic" 이라는 헤더를 destination 헤더로 넣어서 메시지를 송신할 수도 있겠지만, 서버 내에서의 어떤 처리, 혹은 가공이 필요하다면 이 "/app" 이라는 주소로 메시지를 송신하게 됩니다.

그리고 서버가 이를 모두 마쳤다면 이 가공되거나 처리된 메시지를 "/topic" 이라는 경로에 담아서 다시 전송하게 되면 이 메시지가 메시지브로커에게 전달되게 되고, 그 다음에 이 메시지브로커는 전달받은 메시지를 "/topic" 을 구독하고 있는 구독자들에 최종적으로 전달이 됩니다.

#### 정리

> - 1. 구독자들은 "/topic" 경로를 구독하고 있는 상황

- 2. 발신자는 서버를 통한 가공 및 처리를 위해 "/app" 주소로 메시지를 송신합니다.
- 3. 가공을 마친 메시지를 "/topic" 이라는 경로에 담아서 전송하면 그 메시지를 메시지브로커가 전달받습니다.
- 4. 이 메시지브로커는 그 메시지를 "/topic" 을 구독중인 구독자들에게 최종적으로 전달합니다.

---

## 참고

[WebSocket Document](https://developer.mozilla.org/ko/docs/Web/API/WebSocket)
[우아한 형제들 기술블로그](https://techblog.woowahan.com/2547/)

https://www.daddyprogrammer.org/post/4691/spring-websocket-chatting-server-stomp-server/
https://www.joinc.co.kr/w/man/12/websocket
https://www.youtube.com/watch?v=gQyRxPjssWg&t=3085s
https://ssup2.github.io/theory_analysis/Web_Polling_Long_Polling_Server-sent_Events_WebSocket/
https://www.youtube.com/watch?v=yXPCg5eupGM&t=340s
https://www.youtube.com/watch?v=rvss-_t6gzg&t=924s
