---
title: SpringBoot Graceful Shutdown
date: "2023-05-26"
tags:
  - 무중단배포
  - graceful
previewImage: infra.png
series: CI/CD 무중단배포 아키텍처 개선 과정
---

## 학습배경

[[CI/CD] Jenkins 와 Nginx 를 활용한 Blue/Green 자동화 배포 아키텍처를 수동으로 구축하기 (feat. SpringBoot)](https://velog.io/@msung99/CICD-Jenkins-%EC%99%80-Nginx-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-BlueGreen-%EB%AC%B4%EC%A4%91%EB%8B%A8-%EB%B0%B0%ED%8F%AC-%EC%9E%90%EB%8F%99%ED%99%94-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EA%B5%AC%EC%B6%95) 에서 Blue/Green 아키텍처를 직접 구축했습니다. 하지만 Jmeter 로 테스트시 직면했던 `다운타임(DownTime)` 문제와 `요청처리 문제`가 발생했는데, 이를 어떻게 해결하고자 했는지 다루어보고자 합니다.

---

## 다운타임(DownTime) & Response 실패 발생 상황

![](https://velog.velcdn.com/images/msung99/post/aec5224a-6d2e-4b4f-b2e8-5e741fc3019d/image.png)

이전에 진행했던 Blue/Green 아키텍처입니다. 신버전 프로세스가 정상적으로 실행되었는지 Health Check 를 실행한 후 Nginx 의 트래픽 분산 방향을 신버전 서버에다 분산시켰었습니다. 마지막으로 기존 구버전 프로세스는 더 이상 필요없는 것이므로 `즉각적으로 kill` 합니다.

![](https://velog.velcdn.com/images/msung99/post/7f52d612-294d-4eae-9704-75d26b431aaa/image.png)

그런데 정말 이상합니다. Health Check 에 성공하고 문제가 없다고 판단되었을때 안전하게 리버스프록시의 방향을 변경시켰음에도 불구하고, 다운타임이 0.2 초나 발생했습니다. 또한, **구버전 프로세스에서 처리중이였던 요청들이 거절당하고 Response 받는데에 실패했다는 문제가 발생**했습니다.

### 파이프라인의 구버전 프로세스 kill 코드

```java
ssh root@${nginx_ip} "echo 'set \\\$service_url http://${deployment_target_ip}:8080;' > /etc/nginx/conf.d/service-url.inc && service nginx reload"
echo "Switch the reverse proxy direction of nginx to ${deployment_target_ip} 🔄"

if [ "${deployment_target_ip}" == "${blue_ip}" ]
then
	 ssh root@${green_ip} "fuser -s -k 8080/tcp"
else
	ssh root@${blue_ip} "fuser -s -k 8080/tcp"
fi
echo " ✅ 구버전 프로세스를 종료하고, 신버전 프로세스로 교체합니다."
```

이전에 작성했던 코드를 보면, 리버스프록시 방향이 변경되고나서 구버전 프로세스를 "즉각" kill 하고 있습니다. 문제는 "즉각" 적으로 kill 하는데에 있습니다. 구버전 프로세스는 기존에 요청받은 요청 내용들을 모두 처리하고나서 천천히 종료되어야하는데, 기존 요청들은 모두 처리하지도 못하고 위 명령으로 인해 바로 kill 되고 있습니다.

---

## SpringBoot Graceful Shutdown

이 문제를 해결하기 위해선, **프로세스가 아직 처리중인 요청이 있다면 바로 종료되지 않고, 해당 요청들을 모두 처리후 안전하게 종료되어야합니다.** 스프링부트 2.3.0 Release 부터는 `Graceful Shutdown` 기능을 제공해서 이 문제에 대한 해결책을 제공하고 있습니다. 즉, 스프링부트는 프로세스 종료 요청이 들어왔을 때 추가적으로 유입되는 요청을 거절하면서, 기존에 처리중이던 요청을 모두 처리한 뒤에야 안전하게 프로세스를 종료합니다.

### application.yml 설정

설정은 간단합니다. 아래와 같이 application.yml 에서 graceful 옵션을 적용시켜주면 끝입니다.

```java
server:
  shutdown: graceful
```

### 타임아웃 추가설정

위와 같이 graceful shutdown 을 지정해줬을때, 만약 `교착상태(Deadlock)` 과 같은 상황에 빠지면 어떻게될까요? 구버전 프로세스는 정상적으로 종료되지 못하고 무한정 대기하는 상태에 빠지게 될것입니다. 이를위해, 아래와 같이 프로세스에 대한 타임아웃도 설정할 수 있습니다.

```java
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s
```

---

## 리눅스의 프로세스 종료 Signal

그런데, 위와같이 Graceful Shutdown 을 적용한다고 해서 바로 문제가 해결되지는 않습니다. 이 이유는, 구버전 프로세스를 강제로 종료시켜버리는 `SIGKILL` 시그널 을 사용했었기 떄문입니다.

### 리눅스의 시그널(Signal)

리눅스 OS 에서 시그널은 프로세스에게 특정 이벤트를 알리는데 사용되는 메커니즘입니다. 시그널은 프로세스간 통신, 예외처리, 프로세스 관리등 다양한 용도로 사용됩니다. 몇가지 중요한 리눅스 시그널을 나열해보면 다음과 같습니다.

#### SIGKILL

프로세스를 즉시 종료시키는 시그널입니다. 프로세스의 의사와 상관없이 프로세스를 강제로 종료해버리는 시그널입니다. 이 시그널은 프로세스에게 어떤 조치를 취하기도 전에 즉시 종료하라고 요청합니다.

#### SIGTERM

프로세스를 안전하게 종료시키는 시그널입니다. 프로세스가 현재 사용중인 자원을 해제하고, 데이터를 저장하는 등의 모든 작업을 안전하게 수행한 뒤에야 프로세스를 종료시키는 것입니다. 즉, 프로세스를 종료시키기 전에 해당 시그널을 핸들링하는 특이사항이 있다면, 해당 사항을 모두 처리후에 안전하게 프로세스를 종료시킵니다.

#### SIGINT

인터럽트 시그널로, 주로 터미널에서 Ctrl+C를 누르는 동작으로 생성됩니다. 대화형 프로세스에게 종료를 요청하는 시그널입니다.

### 기존에 SIGKILL 을 사용하던 파이프라인

이전에 작성했던 파이프라인 코드를 다시 살펴봅시다. 보면 `-k` 옵션을 통해 구버전 프로세스를 종료시키는 모습을 볼 수 있는데, 이는 추가적인 별도의 옵션이 없다면 `SIGKILL` 시그널로 프로세스를 강제 종료시키는 것입니다. 즉, 구버전 프로세스가 처리중이였던 여분의 요청들이 남아있음에도 불구하고 바로 kill 해버렸던 것입니다.

```java
if [ "${deployment_target_ip}" == "${blue_ip}" ]
then
	 ssh root@${green_ip} "fuser -s -k 8080/tcp"
else
	ssh root@${blue_ip} "fuser -s -k 8080/tcp"
fi
echo " ✅ 구버전 프로세스를 종료하고, 신버전 프로세스로 교체합니다."
```

### SIGTERM 을 적용한 파이프라인 개선 코드

SIGKILL 을 사용한다면, 당연히 구버전 프로세스에게 분산된 요청들의 일부는 정상 수행될 수 없을것입니다. 저희는 `SIGTERM` 시그널을 사용하면 구버전 프로세스가 요청받은 내용을 모두 처리 및 응답후, 자원까지 해제한 후에 종료되도 문제가 없을때가 되었을때 안전하게 종료됩니다.

앞서 언급했기른 SIGTERM 은 해당 시그널을 핸들링하는 특이사항을 모두 처리후에 프로세스를 종료하는 시그널이라고 했었습니다. 이 "특이사항" 에 해당하는 것이 바로 스프링부트의 `Graceful Shutdown` 입니다. 만약 graceful shutdown 을 적용시키지 않았다면, SIGTERM 시그널은 특이사항이 없는 것으로 볼 수밖에 없기 때문에 구버전 프로세스에 대한 요청은 바로 수행되지 못하고 종료될겁니다.

```java
if [ "${deployment_target_ip}" == "${blue_ip}" ]
then
	 ssh root@${green_ip} "fuser -s -k -TERM 8080/tcp"
else
	ssh root@${blue_ip} "fuser -s -k -TERM 8080/tcp"
fi
echo " ✅ 구버전 프로세스를 종료하고, 신버전 프로세스로 교체합니다."
```

당연한 말이지만, SpringBoot 의 Graceful Shutdown 을 적용시켰다고 해서 구버전 프로세스가 모든 요청을 정상 수행후에 종료되는 것이 아닙니다. 만약 SIGKILL 을 그대로 사용했다면 구버전 프로세스는 SIGTERM 과 달리 강제로 종료되버리기 떄문에, graceful shutdown 도 자연스래 무시되버리는 것입니다.

---

## 다운타임 & Response 개선 결과

![](https://velog.velcdn.com/images/msung99/post/95cc8e3c-f361-4d6a-8564-1637354564b7/image.png)

SIGETRM 시그널과 Graceful Shutdown 을 적용시킨 결과, 위와같이 구버전 프로세스에 유입된 요청은 모두 안전하게 처리후 종료되는 결과를 확인할 수 있게 되었습니다. 또한 다운타임이 0.3 초에서 0.2 초로 개선된 결과도 얻게 되었습니다.

---

## 아직 극복해야할 한계점

그러나, 여전히 일부 요청은 거절되고 다운타임이 아직 0.2초나 존재한다는 한계가 존재합니다. 아직 다운타임이 존재하는 이유는 Nginx 로 인한 원인으로 추측되고 있으니, Nginx 의 성능 튜닝과 네트워킹 문제를 개선하는 방향으로 개선후 다시 이를 주제삼아 재밌는 포스팅 내용을 다루어보고자 합니다.

---

## 참고

- [SpringBoot Document : graceful-shutdown](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.graceful-shutdown)
- [Shutdown a Spring Boot Application](https://www.baeldung.com/spring-boot-shutdown)
- [Spring Boot server.shutdown graceful 옵션](https://sas-study.tistory.com/459)
- [SpringBoot 를 우아하게 종료시켜보자!](https://joojimin.tistory.com/24)
