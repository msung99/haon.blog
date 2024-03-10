---
title: Nginx로 http event 를 영역을 튜닝하여 성능 개선하기
date: "2023-01-29"
tags:
  - Nginx
  - 로드밸런싱
  - HTTP
previewImage: infra.png
series: Nginx
---

아래의 명령으로 현상태를 조회해봅시다. 참고로 저는 2Core CPU 를 사용하고 있습니다.

```java
systemctl nginx status
```

![](https://velog.velcdn.com/images/msung99/post/5e8c4c48-7759-4ac9-b87c-ca38d33af73e/image.png)

보듯이 1개의 Master Process 가 존재하며, 2개의 Worker Process 를 사용하고 있음을 알 수 있습니다. CPU 코어 한개당 하나의 Worker Process 가 생성되고 작업을 수행하기 때문이죠.

### 1.Worker Process 는 몇개가 좋을까?

Worker Process 는 무작정 많이 할당한다고해서 좋은 것이 아닙니다. 오히려 자원만 낭비하고, 성능저하의 문제까지 불러올 수도 있기 때문이죠.

따라서 **물리적인 CPU 코어 개수만큼 Worker Process 를 할당하는 것이 가장 이상적**이며, nginx.conf 에서 auto 를 지정해주면 자동으로 CPU 코어 개수에 알맞게 프로세스를 생성해줍니다.

- 각 코어는 서로 프로세스를 공유하지 않기때문에, 모든 코어당 1개의 Worker Process 를 사용하면 전체 서버의 리소스를 최대로 사용하는 셈입니다.

그런데 때로는 10~20% 정도의 CPU 코어는 운영체제를 위해 남겨두는 방법도 좋습니다. 예를들어 20core CPU 를 구성했다면, Nginx 에 대해 사용할 코어수를 16~18개 정도로 할당하고, 나머지 2~4 는 OS 용으로 남겨두는 것도 좋습니다.

![](https://velog.velcdn.com/images/msung99/post/24794db8-8763-4152-924d-a2af76176f0a/image.png)

---

### 2. 커넥션 허용 개수

**각 Worker 프로세스 별 최대 허용 커넥션 개수** 또한 설정해줄 수 있습니다. Nginx 의 Worker.프로세스들이 커넥션을 더 수용할 수 있음에도 불구하고 이를 설정하지 않는다면 최적화 면에서 크게 아쉬울겁니다.

> 각 Worker Process 의 최대 허용 커넥션 수 : 1024개

아래 명령으로 CPU 코어의 커넥션 허용수를 눈으로 확인해봅시다. 보듯이 1024개 인것을 확인 가능합니다.

```
ulimit -n
```

![](https://velog.velcdn.com/images/msung99/post/dfc2c774-5475-41fa-9024-1ad9ba0840f3/image.png)

core의 최대 처리수가 1024이므로, nginx의 max 값도 1024로 설정해서 각 Worker 프로세스들이 커넥션을 처리하도록 해주는것이 가장 이상적입니다. worker connection 변수 값은 event content 안에 작성합니다.

```java
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/.conf.

events {
        worker_connections 1024;
        # multi_accept on;
}

http {
   ...
```

#### 최대 Request 동시 처리수는?

> 위와 같이 1024 로 지정해준다면, **Worker Process 개수 x 1024** 개의 요청을 동시에 처리할 수 있는겁니다.

---

### 3. worker_rlimit_nofile

worker_rlimit_nofile 이란 Worker Process 가 열수있는 최대로 열수있는 파일 수에 대한 제한을 설정하여 처리량을 늘려주는 것입니다.

```java
worker_processes auto;
worker_rlimit_nofile 204800;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/.conf.

events {
```

---

## Event 관련

### epoll

```java
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/.conf.

events {
        worker_connections 2048;
        # multi_accept on;
        use epoll;
}

http {
   ...
```

Nginx 처리 속도 관련해서 설정할 수 있는 옵션입니다.

### Nginx 의 SingleThread

![](https://velog.velcdn.com/images/msung99/post/c2babc47-6088-4dfd-8d52-e64b76977f5f/image.png)

non-blocking I/O를 사용하는 Single Thread 방식의 Nginx에서는 자신에게 연결되어 있는 socket에 읽을 데이터가 있는지 계속 확인하는데 자원을 낭비할 수 있습니다.

> - 요약 : Linux 2.6 이상에서 사용하는 효율적인 Event 처리방식
>   epoll 방식은 nginx의 모든 소켓 파일을 찾아보는게 아니라 **현재 활성화 된 소켓만 확인해서 연결을 설정**해줍니다.

epoll은 linux 소켓을 관리하는 방법중 하나인데 이외에도 poll, select 방식이 있습니다. 모든 소켓파일을 확인하는 poll 방식에 비해서 업그레이드 된 버전입니다.

이 중 poll과 select는 해당 프로세스에 연결된 모든 connection file을 스캔하지만, epoll은 수천개의 file descriptor를 처리할 수 있도록 보다 효율적인 알고리즘을 사용하고 있어 대량 요청이 발생하는 시스템에 적합하다고 합니다.

---

## http 영역

http 블록은 nginx로 들어오는 웹 트래픽에 대한 처리 방법과 방향을 설정해주는 블록입니다. 이에 관한 튜닝도 어떻게 진행할지 알아봅시다.

### 1.keepalive 관련

keepalive 에 대한 이론 설명은 [[Nginx] upstream 서버의 KeepAlive 를 조절해 성능 최적화하기](https://velog.io/@msung99/Nginx-upstream-%EC%84%9C%EB%B2%84%EC%9D%98-KeepAlive-%EB%A5%BC-%EC%A1%B0%EC%A0%88%ED%95%B4-%EC%84%B1%EB%8A%A5-%EC%B5%9C%EC%A0%81%ED%99%94%ED%95%98%EA%B8%B0) 에서 설명했습니다.

keepalive 를 nginx 와 upstream 서버간에 조절 가능한것처럼, 클라이언트와 nginx 사이에서도 조절가능합니다.

- upstream 과 달라진게 있다면, keepalive_requests 옵션입니다.
  keepalive_requests 이란 클라이언트가 커넥션을 계속 유지하며 수행할 수 있는 요청 수입니다. (upstream 서버에서는 keepalive 라는 옵션을 사용)

```java
http{
  keepalive_requests 10000; // (keepalive 갯수)
  keepalive_timeout 30; // (keeplive의 생존 시간)
  // => 최대 1만개의 클라이언트 요청을 유지한다. 각 커넥션은 30초동안 유지된다.
}
```

### 2. reset_timedout_connection

서버가 응답하지 않는 클라이언트에 대한 커넥션을 닫을 수 있도록 허용하는 옵션입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on; // 응답하지 않는 클라이언트에 대한 연결을 자동으로 닫아버림
}
```

### 3. send_timeout

클라이언트에다 Response 을 전송할때 제한된 시간입니다. 응답이 없거나 느린 클라이언트를 제한하는 것입니다.
send_timeout에 지정한 시간안에 client가 아무것도 받지 못하면 connection은 닫힙니다. 디폴트 값은 60초입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2; // 클라이언트에게 Response 를 보내주는 시간이 2초 이상 걸리면
  // 커넥션을 종료한다.
}
```

### 4. client_header_timeout

request 의 Header 정보를 읽는데 설정된 timeout 시간입니다. client_header_timeout에 지정한 시간안에 client가 헤더를 전송하지 않으면 요청은 408(Request Time-out)로 끝나며, 디폴트 값은 60초입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s; // 클라이언트가 60초안에 Header 를 전송 안하면
  // 408 에러를 리턴
}
```

### 5. client_body_timeout

반대로 request 의 Body 정보를 읽는데 설정된 timeout 시간입니다. (디폴트 60초)

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s; // 클라이언트가 60초안에 Body 를 전송 안하면
  // 408 에러를 리턴
}
```

### 6. proxy_read_timeout

proxied server 로부터 응답을 읽는데 설정한 timeout 시간입니다.
전체 응답 전송 timeout 시간이 아니라 두개의 연속적인 읽기 작업 사이의 timeout 시간입니다.

proxy_read_timeout에 지정한 시간안에 proxied server가 아무것도 전송하지 않으면 connection은 닫히며, 디폴트 값은 60초이다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s;
  proxy_read_timeout 60s;
}
```

### 7. proxy_send_timeout

반대로 proxied server로 요청을 전송하는데 설정한 timeout 시간입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s;
  proxy_read_timeout 60s;
  proxy_send_timeout 60s;
}
```

### 8. sendfile

nginx에서 정적파일을 보내도록 설정하는 것입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s;
  proxy_read_timeout 60s;
  proxy_send_timeout 60s;
  sendfile on;
}
```

### 9. tcp_nopush

클라이언트로 패킷이 전송되기 전에 버퍼가 가득 찼는지 확인하여, 다 찼으면 패킷을 전송하도록 하여 네트워크 오버헤드를 줄이도록 설정하는 것입니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s;
  proxy_read_timeout 60s;
  proxy_send_timeout 60s;
  sendfile on;
  tcp_nopush on;
}
```

### 10. tcp_nodelay

소켓이 패킷 크기에 상관없이 버퍼에 데이터를 보내도록합니다.

```java
http{
  keepalive_requests 10000;
  keepalive_timeout 30;
  reset_timedout_connection on;
  send_timeout 2;
  client_header_timeout 60s;
  client_body_timeout 60s;
  proxy_read_timeout 60s;
  proxy_send_timeout 60s;
  sendfile on;
  tcp_nopush on;
 tcp_nodeplay on;
}
```

---

### 적용한 모습

최종적으로 nginx.conf 의 http 영역을 아래와 같이 적용해봤습니다. 위에서 다 살펴본 내용들이죠?

![](https://velog.velcdn.com/images/msung99/post/19f6d3c1-a5af-465d-b306-5deab2613100/image.png)
