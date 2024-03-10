---
title: Nginx 의 keep-alive 를 조정하여 성능을 개선해보자!
date: "2023-01-30"
tags:
  - Nginx
  - handshake
  - keep-alive
previewImage: infra.png
series: Nginx
---

## TCP 4-way Handshaking

우선 저희는 TCP 4-way Handshaking 가 무엇인지 먼저 알아야합니다.

![](https://velog.velcdn.com/images/msung99/post/06070a51-cafe-4136-9385-d34da31bec01/image.png)

3-way handshake 가 클라이언트와 서버가 TCP 연결을 맺을때 사용한다면, **4-way handshake 는 연결을 끊을때, 즉 세션을 종료할때 수행되는 절차입니다.**

만약 3-way handshake 를 잘 모르시는분들은 [IP 프토로콜의 한계, TCP 3-way-handshake, Port](https://velog.io/@msung99/IP-TCP-UDP) 를 참고하시면 좋겠습니다.
또한 소켓이 생성되고, 소켓을 통해 handshaking 을 수행하는 것입니다.

이때 소켓이 생성될 때는 3-way handshaking 을 통해서 생성되지만, 종료될때는 4-way handshaking 을 거쳐서 종료됩니다.

---

## 4-way handshaking 과정

소켓이 종료될때는, 즉 클라이언트와 서버가 연결이 끊어질때는 4단계를 거쳐서 종료됩니다.

- 1.클라아이언트가 서버에게 연결 종료를 요청합니다.

- 2.서버는 바로 종료시키는 것이 아니라, 단순히 ACK 만을 날립니다. 서버는 종료시키기 전에 본인도 마저 할일이 있기 때문에 바로 FIN 을 날리지 않고, 단순히 ACK를 날리고 CLOSE_WAIT 상태로 넘어갑니다.

- 3.서버는 본인이 할일을 다 마쳤다면 그제서야 FIN 을 날리고 연결을 종료하고자 합니다.

- 4.클라이언트는 서버의 FIN 을 잘 받았다는 ACK 를 서버에게 보내게되고, 서버는 ACK 를 전달받으면 소켓을 timewait 시간동안 기다린 후, timewait 이 끝나면 그때서야 종료시킵니다.

그런데 이때 4번 과정에서 **클라이언트는 ACK 를 날리고 난후 소켓이 종료(제거)될때 까지 TIME_WAIT 상태에 있게 된다는 점**을 주목하셔야 합니다.

timewait 이 뭘까요? 지금부터 알아봅시다.

---

## TimeWait

### TimeWait 이란?

4-way handshake 에서 소켓이 바로 종료(제거)되지 않고, 일정시간동안 대기한 후 제거되어야 합니다. 이때 이 일정 대기시간을 TimeWait 이라고 부릅니다.

### TimeWait 은 왜 필요한가?

time_wait 에 있는 동안에는 OS 커널이 IP 주소와 PORT 바인딩합니다. 때문에 해당 소켓을 종료시키려 했던것을 다시 취소하고 재활용하려고 해도 사용이 불가능합니다.

![](https://velog.velcdn.com/images/msung99/post/564ed27e-0ce4-482c-8f13-ae73b9393551/image.png)

그렇다면 이렇게 불편한 대기시간은 왜 필요할까요?

> 요약 : 네트워크 상의 문제로 클라이언트가 ACK 를 보내주지 못하는 경우가 발생할 수 있다. 이런 경우를 대비해, 서버가 다시 FIN 을 보내서 클라이언트로부터 ACK 를 확실히 응답받을 때 까지 혹시모를 대기시간(timewait) 이 필요한것이다.

만약 time_wait 없이 클라이언트가 서버로 보낸 마지막 ACK 종료메시지 이후 바로 소켓을 종료했다고 가정해봅시다. 그런데 라우터 문제오 같이 네트워크 상에서 발생하는 어떤 원인에 의해 마지막 종료 메시지 ACK 가 서버에 도착하지 않을 수도 있습니다.

이러면 서버는 소켓을 종료하지 못하고, 불안한 마음에 다시 한번 클라이언트에게 FIN 을 날립니다.

그런데 timewait 대기시간없이 바로 종료되었다면, 이 마지막 FIN 역시 무했을테고 **서버는 여전히 소켓이 종료되었는지, 또는 살아있는지 알지못하고 안절부절 못하고 있게 될 겁니다.**

하지만 TIME_WAIT에 있는 클라이언트의 소켓은 여전히 주소와 포트를 바인딩 하고 있는 상태이기 때문에, timewait 대기시간동안에 다시 날아 오는 서버의 FIN을 감지하고 다시한번 마지막 ACK를 날려 줄 수 있는 것입니다.

---

## Nginx 를 통한 로드밸런싱

![](https://velog.velcdn.com/images/msung99/post/33d918ca-51ae-41f2-b304-7cab54a1bcc0/image.png)

[[Nginx] 로드밸런싱 환경을 구축해 트래픽 분산시키기 (feat. 무중단배포)](https://velog.io/@msung99/Nginx-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1-%ED%99%98%EA%B2%BD%EC%9D%84-%EA%B5%AC%EC%B6%95%ED%95%B4-%ED%8A%B8%EB%9E%98%ED%94%BD-%EB%B6%84%EC%82%B0%EC%8B%9C%ED%82%A4%EA%B8%B0-feat.-%EB%AC%B4%EC%A4%91%EB%8B%A8%EB%B0%B0%ED%8F%AC) 에서도 보았듯이, 보통 proxy_pass 지시자를 통해 Nginx 서버에서 받은 요청을 넘겨줄 서버를 정의하는 지시자가 upstream 입니다.

### 문제점1) 3,4-way-handshaking 으로 인한 성능저하

겉보기에는 Nginx 서버를 중간에 배치하는데 별 문제가 없어보일 수 있지만, 사실 **로드밸런서로 인해 성능 저하**의 문제를 불러볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/98bdd301-906a-4c25-94d0-e17afe79faa2/image.png)

위와 같이 클라이언트가 서버에게 요청을 보낸다면, 3-way handshake 가 2번 발생합니다. 당연한 말이죠?

![](https://velog.velcdn.com/images/msung99/post/adcec2ea-0935-427e-b230-f754c0cfeac4/image.png)

또한 4-way handshaking 까지 발생하면서, HTTP 통신을 하는데 handshaking 이 자주 발생하다보니 **네트워크 자원 낭비가 심해서, 성능이 저하될 수밖에 없죠. **

### 문제점2) Timewait 대기상태에 있는 소켓이 많아지는 경우 : 로컬포트 고갈

**또한 4-way handshaking 이 자주 발생한다면, 대규모 트래픽이 발생한 경우 timewait 대기시간동안 제거되지 않고 있는 소켓이 대거 발생할 수 있습니다.** 이는 곧 로컬포트(local Port)가 고갈될 위험으로 이어지게 되죠.

대규모 트래픽이 발생해서 로컬포트가 고갈되는 경우, 다시 로컬포트를 사용하고 싶어도 timewait 대기시간 60초가 지나고 나서야 다시 사용 가능해집니다.

---

## 해결방안 : KeepAlive 를 설정해주자

![](https://velog.velcdn.com/images/msung99/post/1ef76b8e-c230-4d02-92e3-de736c62352e/image.png)

### HTTP 의 Connectionless(비연결성) 특징을 해결해보자.

저희는 HTTP 의 특징을 잘 파악하고, upstream 서버를 잘 최적화 해놓는다면 트래픽 처리에 대한 문제가 해결될 수 있습니다.

HTTP 통신의 특징은 요청-응답이 오갈때 **한번 연결을 맺은뒤로 데이터를 주고받은후에, 바로 연결을 끊어버린다는 특성(비연결성) 을 지닙니다.** 즉, 계속해서 실시간으로 클라이언트와 서버가 주고받을 데이터가 많아도, 매번 3,4-way handshaking 이 발생한다는 점입니다.

결국 클라이언트는 데이터를 계속 주고받고 싶다면, TCP 연결(handshaking) 을 처음부터 또 해야하며, 이 과정에 불필요하게 TCP handshake 가 한번 더 발생합니다.

### Keepalive 로 연결을 계속 유지시켜보자.

저희는 Nginx 의 Keepalive 라는것을 별도로 설정해주면 불필요한 handshake 과정을 줄일 수 있습니다.

**keepalive 는 클라이언트의 연결 요청을 처리한 후 바로 연결을 끊는것이 아니라, 연결을 끊지않고 일정시간 대기하는 시간**을 의미합니다. 이 keepAlive 는 keepalive timeout 설정으로 대기시간을 지정해줄 수 있습니다.

> keepalive 를 지정해주면 이렇게 클라이언트의 요청이 여러번 있을때, 클라이언트는 한번만 TCP 세션을 연결하고 이후로는 Keepalive 시간동안 동일한 세션으로 데이터를 계속 주고받을 수 있게됩니다.

결국 불필요하게 TCP 세션 연결을 하지 않아도되고, 더 빠르게 통신이 가능해집니다.

---

## Upstream 서버가 keepAlive 설정이 없다면?

앞서 설명드린 내용들은 다시 리마인딩 느낌으로 설명드리면서, keepalive 설정이 없는 경우를 설명드리겠습니다.

보통 upstream 서버에 대한 설정은 아래와 같이 진행할겁니다.

```java
upstream backend{
  server 111.11.111.111:8080;
  server 222.22.222.222:8080;
}
```

![](https://velog.velcdn.com/images/msung99/post/dd1a2ea6-4802-46b1-abd6-f72a04137305/image.png)

이런 기본 설정을 하게딜 경우의 문제점을 뭘까요? 앞서 계속 말한 내용입니다.
바로 Nginx 와 WAS 를 연결하는 내부 통신에도 매 요청마다 TCP 세션을 만들고 handshake 가 일어난다는 점입니다.

Nginx 에서 WAS 로 넘기는 것도 똑같은 TCP 통신이기 때문에 handshake 를 하게되고, keepalive 가 켜져있기 않기 때문에 한번의 요청만 처리한 후 소켓이 끊어집니다.

결국 문제점이 발생합니다.

- keepalive 를 통해 소켓이 유지되지 않기 때문에 다수의 timewait 소켓이 만들어져서 로컬포트가 고갈된 다는점,
- 또 불필요한 handshake 가 일어남으로써 응답속도 지연을 일으킬 수 있다는 점입니다.

=> 사실 timewait 이 생긴다고 해서 성능에 큰 지장은 없습니다. 다만 Nginx 입장에서는 로컬포트를 사용하게 되고 초당 요청 빈도수가 높은 서버는 로컬포트의 고갈로 이어지게 되는 것입니다.

---

## Upstream 서버에 keepalive 설정

```java
upstream backend {
	server 111.11.111.111:8080;
  	server 222.22.222.222:8080;
    ...
    keepalive 100; // keepalive 갯수
    keepalive_timeout 30; // keeplive의 생존 시간 (초)
}
```

여러 번의 GET 요청 등이 있을 때 클라이언트는 한 번만 TCP 세션을 연결하고 생존 시간동안 동일한 세션으로 데이터를 주고 받을 수 있습니다.

결론적으로 불필요한 timewait 대기상태의 소켓이 생성되지 않게 막아줍니다. Nginx 와 WAS 서버간에 불필요한 통신을 최소화해주는 것이죠.

### keepalive 의 개수는 얼만큼 설정할까?

keepalive 의 개수는 얼마나 설정하고, 생존시간은 얼마로 설정할지 고민될 수 있습니다. 이에대한 정해진 정답은 없습니다. 서비스마다 처리해야할 트래픽양에 따라서 결정하면 되죠. **keepalive 수는 성능 테스트를 하며 조절하면 됩니다.**

보통은 16~32개를 넘어갈 일은 없어보입니다. 하지만 트래픽, 서버 사양에 따라서 1000,2000개를 넘게 설정해야 할수도 있습니다.

### 기타 유의사항

```java
upstream backend {
	server 111.11.111.111:8080;
  	server 222.22.222.222:8080;
    ...
    keepalive 100; // keepalive 갯수
    keepalive_timeout 30; // keeplive의 생존 시간 (초)
}

server{
  ...
  location /http/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

- 유의사항이 있다면 HTTP 버전은 1.1로 지정되어야하고, Connection header 는 빈값으로 전달해야 합니다.

또한 웹소켓과 관련한 애플리케이션에서는 작동하지 않을 수 있습니다.

> 자세한 설정정보는 Nginx 공식문서 [Nginx Docs](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive) 를 참고하자!

---

## 성능차이

upstream keepalive 를 적용하면, Nginx 를 중간에 웹서버로 배치하면서 발생하는 성능 저하가 발생하긴합니다.

**결국 WAS 서버만을 사용하는 것보다 성능 저하가 일어나긴 하지만, upstream keepalive 를 적용하지 않았을 때 보다는 더 좋은 성능을 보입니다.**

---

## Keepalive 의 단점

몰론 Keepalive 에도 장점만 있는것은 아닙니다.

> - 메모리 사용의 증가 : KeepAlive를 사용 하는 것은 서버의 메모리 사용을 늘리게 됩니다. Nginx 프로세스들은 연결된 접속(Connections)에서 새로운 요청이 있을 때까지 접속(Connection)을 열고 기다려야만 합니다.

---

- 요청을 받아들이지 못하는 경우 발생 : 사용자가 많다면 연결이 늘어나서 새로운 사용자를 받아들이지 못하는 경우가 빈번히 일어납니다.

그래서 사용자가 많고 유동이 많은 서비스에서는 사용이 권장되지 않습니다.

프로세스들이 대기하는 동안 그들은 다른 사용자(Clients)들이 서비스를 위해 사용 해야 하는 RAM을 차지 하고 있는겁니다.

만약 KeepAlive를 끄게 된다면 소수의 Nginx 프로세스들은 남아서 활동 할 수 있게 됩니다. 메모리 사용을 줄이는 동시에 Nginx 하여금 더 많은 사용자들에게 서비스를 제공 할 수 있게 되는 것이죠.

---

## 참고

- [Nginx Docs](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive)
- [[server]keepalive와 timewait의 상관관계](https://velog.io/@kimjiwonpg98/serverkeepalive%EC%99%80-timewait%EC%9D%98-%EC%83%81%EA%B4%80%EA%B4%80%EA%B3%84)
- [2018 세미나 - Server에서 만남을 추구하면 안되는 걸까](https://devahea.github.io/2018/04/23/server-ec-97-90-ec-84-9c-eb-a7-8c-eb-82-a8-ec-9d-84-ec-b6-94-ea-b5-ac-ed-95-98-eb-a9-b4-ec-95-88-eb-90-98-eb-8a-94-ea-b1-b8-ea-b9-8c/)
- [nginx upstream 성능 최적화](https://brunch.co.kr/@alden/11)
- [[Web]서버와의 연결을 계속? Keep Alive!](https://kamang-it.tistory.com/599)
  [14. 서버를 어떻게 세팅해야 할까?](https://colinch4.github.io/2020-07-30/t-14/)
- [[네트워크] 3-way / 4-way Handshake 란?
  ](https://bangu4.tistory.com/74)
