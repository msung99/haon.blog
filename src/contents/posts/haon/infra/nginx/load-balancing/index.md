---
title: Nginx로 로드밸런싱 환경을 구축해 트래픽 분산시키기
date: "2024-10-28"
tags:
  - Nginx
  - 로드밸런싱
previewImage: infra.png
series: Nginx
---

## 시작에 앞서

서비스 사용자가 늘어남에따라 **서버의 부하를 방지하도록** 로드밸런싱을 하여 트래픽을 적절히 분산시키는 환경을 간단히 실습해보고자 합니다. 이번 포스팅에서는 Nginx 로 직접 Reverse Proxy 를 셋팅하고 뒷단에 스프링부트 서버 3대를 배치하여, 트래픽을 골구로 분산시키는 것을 구현해 보겠습니다.

---

## 다중서버 구축 도메인 설계

![](https://velog.velcdn.com/images/msung99/post/29abd7a5-3dea-4fc0-a099-8755232d1311/image.png)

저희는 총 4개의 클라우드 서버 인스턴스를 생성해야합니다. 하나는 WS(웹서버)로써 Reverse Proxy 를 위한 Nginx 서버입니다. 나머지 3개의 서버에서는 8080포트로 다른 IP 서버를 구축할겁니다.

- 클라우드 서버는 EC2 인스턴스를 4개 생성할까 고민했지만, 비용이 많이 나가는 것을 고려하여 Linode 에서 Ubuntu 22.04 LTS 를 기반으로 서버를 구축했습니다.

- 추가적으로 로드밸런싱 알고리즘은 가장 기본적인 Round Robin(라운드 로빈) 알고리즘으로 트래픽을 분산시켰습니다. (알고리즘에 대한 설명도 할것이니 걱정마세요!)

---

## 애플리케이션 설계

![](https://velog.velcdn.com/images/msung99/post/3911e5cc-f585-4c79-a5b6-7b1d35dcaa35/image.png)

동일한 코드를 각 서버에서 실행시킬겁니다. 각 서버에서는 서버이름(serverName) 과 사용자 방문횟수(visitedCount) 를 멤버변수로 가지고 있는 구조입니다.

매 방문마다 어떤 배포 서버에 접속했는지를 알 수 있도록 ServerName 와, 방문횟수를 매번 카운팅하여 몇번 방문했는지를 나타내는 visitedCount 변수의 값을 Map 형태로 리턴받는 구조입니다.

---

## SpringBoot 코드 구현

### ServerController

아래와 같이 RestController 하나를 생성하고, 이 컨트롤러로 현재 요청을 보낸 서버에 대한 이름과 방문횟수를 조회할 수 있는 기능을 만들었습니다.

이떄 @PropertySource 어노테이션을 통해 application.yml 에 존재하는 serverName 변수값을 불러왔습니다.

```java
@RestController
@PropertySource(value = "application.yml")
public class ServerController {

    @Value("${serverName}")
    private String serverName;
    private Integer visitedCount = 0;

    @GetMapping("/getServerInfo")
    public ResponseEntity<Map<String, String>> getServerInfo(){
        visitedCount++;

        Map<String, String> serverInfo = new HashMap<>();
        serverInfo.put("ServerName:", serverName);
        serverInfo.put("visitedCount:", visitedCount.toString());

        return ResponseEntity.ok(serverInfo);
    }
}
```

### application.yml

또 아래와 같이 application.yml 파일을 구성해줬습니다. 이떄 중요한 것은 각 서버를 구분짓기 위한 **프로필(Profile) 설정**을 진행해준 것입니다.

각 서버의 애플리케이션 코드는 모두 동일하나, 단순히 IP, 사용자 정보 정도만 바뀌는 정도라면 이렇게 application.yml 과 같은 설정파일에 프로필을 기록하는 것입니다.

즉, 애플리케이션 코드는 전부 동일한데 설정정보만 조금 다르게 하고 싶다면, 각 서버를 구분지어줄 프로필을 부여하면 됩니다. 그러고 각 서버를 실행시킬때 각각 다른 프로필 정보에 기반해 실행하면 됩니다.

```java
spring:
  config:
    activate:
      on-profile: server1

serverName: my-server1


---
spring:
  config:
    activate:
      on-profile: server2

serverName: my-server2

---
spring:
  config:
    activate:
      on-profile: server3

serverName: my-server3
```

추후에 클라우드 서버에 올린 jar 파일을 실행할때 위와 같이 프로필 정보를 함께 입력해서 nohup 으로 실행하면, 해당 프로파일의 설정으로 애플리케이션을 시작할 수 있게됩니다.

---

## 클라우드 환경 구축

클라우드 서버는 앞서 말씀드렸듯이 1개의 Nginx 서버와, 뒷단에서 스프링부트 애플리케이션이 실행되고 있는 3개의 서버를 구축했습니다. 우선 스프링부트 서버를 어떻게 구축했는지를 설명해보고자 합니다.

---

## 스프링부트 클라우드 서버 환경

### 1.jdk-11 설치

현재 Ubuntu 서버에는 자바가 설치되어 있지 않을겁니다. 자바 설치 여부를 확인해봅시다.

```java
java --version
```

만일 설치되어 있지 않다면 아래와 같이 자바를 서버에 설치해줍시다. default-jdk 로 jdk 를 설치하는 경우 기본적으로 jdk-11 이 설치된다는 점을 알고 넘어갑시다.

- 만일 본인의 프로젝트가 JAVA 11 버전이 아니라면 다른 방법을 통해 설치해주셔야합니다!

```java
apt-get update
apt install default-jdk -y
```

그러고 다시 자바 버전을 확인하여 자바가 정상적으로 설치되었는지 확인해봅시다!

```java
java --version
```

---

### 2.로컬에있는 jar 파일 전송

다음으로 로컬에서 작업한 스프링부트 프로젝트를 빌드하고 생성된 jar 파일을 클라우드 서버에 전송해봅시다. 저는 이번에는 scp 전송을 활용했습니다.
(SSH 도 사용해도 되지만, 예전에 사용해본 경험이 있어서 새로운 방식을 택했습니다!)

아래처럼 gradlew 디렉토리에서 booJar 를 통해 프로젝트를 빌드하여 jar 파일을 생성합시다.

```
$ ./gradlew bootJar
```

아래처럼 빌드에 성공해야합니다!

![](https://velog.velcdn.com/images/msung99/post/41461ca6-7ac5-45df-98d4-4f0d2446a5e9/image.png)

그러면 생성된 jar 파일은 build/libs 안에 존재할겁니다.

```java
$ cd build
$ cd libs
$ ls   //  core-0.0.1-SNAPSHOT.jar
```

---

### 3.로컬에 생성한 jar 파일을 클라우드 서버 3개에 각각 전송하기

이렇게 생성된 jar 파일을 클라우드 서버에 전송하면 됩니다. 앞서 말씀드렸듯이 SCP 를 활용했으며, 그 방법은 다음과 같이 진행해주시면 됩니다.

참고로 test-server 란 제가 jar 파일을 제가 새롭게 파일명을 지어준것입니다.

또 당연한 말이지만, 클라우드 서버 인스턴스를 3개 생성했다면 각 서버에 대해 모두 jar 파일을 각각 전송해주셔야합니다!

```java
$ {파일명}.jar root@111.111.111.111:test-server.jar
// build/libs 에서 실행해주세요! (jar 파일에 존재하는 디렉토리에서)

ex) $ scp core-0.0.1-SNAPSHOT.jar  root@111.111.111.111:test-server.jar
```

jar 파일을 전송할떄 아래와 같이 root 계정의 비밀번호를 입력하도록 해야하는데, 본인의 클라우드 서버의 루트 계정을 입력해주시면 전송에 성공할겁니다.

![](https://velog.velcdn.com/images/msung99/post/46f2127a-10a6-4ddc-a666-af415993c90a/image.png)

클라우드 서버에서 jar 파일이 잘 전송되었는지 확인도 해봅시다!

![](https://velog.velcdn.com/images/msung99/post/1ad53b68-d6dd-4848-98bf-b64d65225952/image.png)

---

### 4.스프링부트 애플리케이션 실행하기 (Background 실행)

이제 클라우드 서버에 전송된 jar 파일을 실행시키면 스프링부트 애플리케이션이 배포될 겁니다. 저희는 서버가 다운되는 일이 없도록 nohup 을 통해 무중단배포를 실행할겁니다.

- 이떄 프로필명을 구분지어서 각 서버에서 다른 프로필에 기반하여 각각의 다른 설정정보를 기반으로 스프링부트 애플리케이션을 실행시켜주셔야 합니다.

- 아래와 같이 각 3개의 서버에서 프로필명을 각각 server1, server2, server3 로 실행시켜주시면 됩니다.

```java
$ nohup java -jar Dspring.profiles.active="프로필명" test-server.jar &

ex) $ nohup java -jar -Dspring.profiles.active=server1 test-server.jar &
```

아래와 같이 실행되면 정상입니다.

![](https://velog.velcdn.com/images/msung99/post/866dce55-963c-4f4a-a281-a8e40e783ff7/image.png)

또 백그라운드에서 스프링부트 애플리케이션이 잘 실행되고 있는지를 확인해봅시다.

```java
$ jobs
```

---

## Nginx 로드밸런서 서버 구축

다음으로 Nginx 로 로드밸런싱을 해주도록, 인스턴스 서버 하나에 Nginx 를 설치하고 Reverse Proxy 를 셋팅해주겠습니다.

### Nginx 설치

아래와 같이 Nginx 를 설치해줍시다.

```java
$ apt install nginx     // nginx 설치
$ serivce nginx start   // 설치한 Nginx 가 정상적으로 반영되도록 재시작
$ ps -ef | grep nginx        // 정상적으로 Nginx가 실행되었는지 확인
```

### Nginx 설정파일 생성

그러고 Nginx 가 로드밸런싱을 하기위한 설정파일을 새롭게 생성해주고, 그 설정파일을 기반으로 뒷단의 스프링부트 애플리케이션에 트래픽이 분산되도록 해야합니다.

- 기본적으로 Nginx 는 http 요청이 들어왔을때 sites-enabled 디렉토리 안에 있는 파일들의 설정정보를 기반으로 로드밸런싱과 같은 일련의 작업을 수행합니다.

- 따라서 아래와 같이 sites-enabled 로 이동해서 로드밸런싱을 해주기 위한 새로운 파일을 생성하고, 설정정보를 기입해줍시다.

- default 파일은 말그대로 http 요청이 들어왔을때 Nginx 에 어떤 작업을 수행할지에 대한 디폴트 설정정보 파일입니다. 이 디폴트 파일은 삭제시키고 저희만의 새로운 로드밸런싱 관련 파일을 만들어줍시다.

```java
$ cd /etc/nginx/sites-enabled
$ rm -rf default //  default 파일 삭제
$ vi myapp      // nginx 로드밸럱싱 파일에 대한 새로운 파일생성
```

> cf) Nginx 에 대한 설정정보 파일을 스캔하는 디렉토리를 새롭게 설정할 수 있습니다. 즉 sites-enabled 가 아닌 다른 디렉토리로도 설정이 가능합니다. 이는 nginx.conf 에서 수정해주시면 됩니다!

---

## Nginx 로드밸런싱 설정하기

### myapp 설정파일 구성

다음으로 이번 포스팅의 핵심인 Nginx 의 로드밸런싱 설정입니다. 직전에 생성한 myapp 에서 아래와 같이 구성해주시면 됩니다.

- 클라이언트의 모든 요청은 80 포트로 들어오게 됩니다. 80 포트로 들어온 요청을 upstream 에 지정해준 3개의 스프링부트 서버로 로드밸런싱이 진행됩니다.

- Nginx upstream 이란?

=> upstream 서버는 말로 Origin 서버라고도 부르비다. proxy_pass 를 통해 Nginx 웹서버가 받은 요청들을 여러대의 스프링부트 애플리케이션 서버로 넘겨주는 역할을 수행합니다.

```java
upstream backend{
        // 로드밸런싱 디폴트 알고리즘 : Round Robin
        server 111.111.111:8080;  // 스프링부트 애플리케이션이 실행되고 있는
        server 111.222.222:8080; // 서버 3개에 대한 IP 주소를 명시해주자!
        server 333.333.333:8080;
}

server{
        listen 80;  // 클라이언트가 요청하는 포트

        location / {
                proxy_pass http://backend;  // 설정한 이름으로 요청 보내기
        }
}
~
```

### 설정정보 다시 불러오기

```
$ nginx -s reload
```

설정파일인 myapp 을 변경했다면 정상적으로 반영이 되도록, 위 명령을 통해 Nginx 의 설정 파일을 다시 로드하도록 합시다!

---

## 트래픽 분산 눈으로 확인해보기

위와 같이 Nginx 설정정보가 반영되었다면 Nginx 서버에 API 요청을 보내봅시다. 그러면 아래와 같은 결과를 확인할 수 있을겁니다!

- 보시듯이 3대의 서버에 트래픽이 골구로 분산되는 모습을 확인할 수 있습니다.

```
{
    "ServerName:": "my-server1",
    "visitedCount:": "1"
}
{
    "ServerName:": "my-server2",
    "visitedCount:": "1"
}
{
    "ServerName:": "my-server3",
    "visitedCount:": "2"
}
{
    "ServerName:": "my-server1",
    "visitedCount:": "2"
}
{
    "ServerName:": "my-server2",
    "visitedCount:": "2"
}

{
    "ServerName:": "my-server3",
    "visitedCount:": "2"
}
{
    "ServerName:": "my-server1",
    "visitedCount:": "3"
}
        // ...
```

---

## 로드밸런싱 알고리즘

사실 로드밸런싱을 하는 방법이 다양하다는 사실 알고 계신가요?

- 위에서 진행한 방식은 Round Robin(라운드 로빈) 알고리즘을 사용해서 트래픽을 분산시킨 것입니다.

별도로 알고리즘을 지정해주지 않으면 라운드 로빈 알고리즘을 사용하는 것이죠.

### 알고리즘 종류

| 알고리즘 종류         | 설명                                                                                             |
| :-------------------- | ------------------------------------------------------------------------------------------------ |
| Round Robin (Defualt) | 요청을 순서대로 처리                                                                             |
| least_conn            | 현재 연결수가 가장 적은 서버로 요청을 전송                                                       |
| ip_hash               | 클라이언트 IP 를 해싱하여 특정 특정 클라이언트가 특정 서버로 연결되게 한다                       |
| Random                | 트래픽을 무작위로 분배                                                                           |
| least_time            | 연결수가 가장 적으면서 + 평균 응답시간이 가장 적은 서버를 선택해서 분배 (Nginx Plus) 에서만 가능 |

---

### 알고리즘과 어떻게 적용시키지?

알고리즘 적용은 앞서 적용했던 Nginx 설정파일에서 upstream 에 지정해주시면 됩니다.

```java
upstream backend{
        leaast_conn;   // least_conn 알고리즘을 적용
        server 111.111.111:8080;
        server 111.222.222:8080;
        server 333.333.333:8080;
}

server{
        listen 80;

        location / {
                proxy_pass http://backend;
        }
}
```

---

## server 에 대한 다양한 옵션

알고리즘 외에도 다양한 server 지시어에 다양한 옵션을 부여해서 트래픽을 분산시킬 수 있습니다.

### weight

특정 서버에 가중치를 설정 가능합니다. 가중치가 설정된 서버는 다른 서버보다 가중치의 배수만큼 트래픽을 받게됩니다.

```java
upstream backend {
  server 111.111.111:8080 weight=4;  // 다른 서버보다 4배의 트래픽을 받는다.
  server 222.222.222:8080;
  server 333.333.333:8080;
}
```

### down

down 옵션을 부여하면 특정 서버로 트래픽이 분배되지 않도록 할 수 있습니다.

```java
upstream backend {
  server 111.111.111:8080 down;  // 2, 3번째 서버만 트래픽을 분배받는다.
  server 222.222.222:8080;
  server 333.333.333:8080;
}
```

### max_conns

서버와의 최대 동시 커넥션 수를 지정된 숫자만큼으로 제한하는 옵션입니다.

```java
upstream backend {
  server 111.111.111:8080 max_conns=10;  // 최대 10개의 트래픽을 분배받는다.
  server 222.222.222:8080;
  server 333.333.333:8080;
}
```

---

## 마치며

지금까지 Nginx 를 통해 로드밸런싱을 진행하고, 뒷단에 존재하는 3대의 스프링부트 서버에 대해 트래픽을 분산시키는 다양한 알고리즘과 옵션에 대해 알아봤습니다. Nginx 를 학습하시는 분들에게 이번 포스팅이 도움이 되었으면 하는 바람입니다 😉

---

## 참고

[[Nginx] Load Balancing 설정하기](https://hays99.tistory.com/250)
[[Nginx] 로드밸런싱 개념 및 구축](https://velog.io/@kimjiwonpg98/Nginx-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1-%EA%B0%9C%EB%85%90-%EB%B0%8F-%EA%B5%AC%EC%B6%95)
[WebServer[nginx] nginx 로 로드밸런싱 하기](https://kamang-it.tistory.com/entry/WebServernginxnginx%EB%A1%9C-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1-%ED%95%98%EA%B8%B0)
[Nginx 로드밸런싱 적용하기](https://www.blog.ecsimsw.com/entry/Nginx-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0)

[[springboot] 스프링부트 jar 파일 백그라운드 실행방법](https://solbel.tistory.com/1433)
[스프링부트 Profile 사용하기](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=edy5016&logNo=221280993916)
[cannot find symbol method value() 에러 해결](https://velog.io/@dabeen-jung/cannot-find-symbol-method-value-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0)
[nohup 명령어 활용하기](https://blog.acronym.co.kr/555)
