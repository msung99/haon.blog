---
title: 도커의 개념, 하이퍼바이저 및 컨테이너 기술의 장배경
date: "2023-02-04"
tags:
  - Docker
previewImage: docker.png
---

> 가상화, 도커의 등장배경에 대해 다루어보고자 합니다. 혼자 공부하며 작성한 것이므로 틀린 내용이 많을 수 있어요!

## 시작에 앞서 : 왜 글을 작성하는가?

"배포" 라는 말을 들어봤을때, 대부분 서버 개발자분들이 Docker 를 한번쯤은 들어보셨거나 사용해보셨을 겁니다. **그런데 많은 분들이 도커를 왜 써야하며, 어떤 메커니즘으로 돌아가는 것인지 잘 모릅니다.** 저희는 도커라는게 그저 다들 사용하는거니까, 이유도 모르고 사용해야할까요?

많은 분들이 제 포스팅을 보시고 도커를 깊게 학습하시는데 도움이 되셨으면 합니다 😀

---

## 도커란?

![](https://velog.velcdn.com/images/msung99/post/30bda8ad-63b3-400e-8282-9ca22fa2d38f/image.png)

많은 분들에게 도커가 무엇인지 물어보면 아래와 같이 대답할겁니다.

> 도커란 컨테이너 기반의 가상화 도구입니다.

여기서 컨테이너란 무엇이고, 가상화란 무엇일까요? 이들을 먼저 이해해야합니다.

---

## 가상화 등장배경

### 서비스 플랫폼 사이의 충돌

가상화를 설명하기전에, 가상화가 필요한 이유에 대해 알아봅시다.

![](https://velog.velcdn.com/images/msung99/post/9be16346-c9b7-482f-816a-1bf552c75e1f/image.png)

여기 가격이 천만원이나 하는 엄청 좋은 서버가 있습니다. 이 서버가 직접 개발한 쇼핑몰 사이트를 돌리기로 했습니다. 고정 사용자가 1천명정도나 되죠 그러나 기껏 비싸게 구매했더니, 막상 서버의 성능의 반의 반도 사용하지 않고 있습니다.

![](https://velog.velcdn.com/images/msung99/post/60344571-4362-4823-9fd5-45c6a8317909/image.png)

이대로는 서버 비용 및 유지가 부담스러워서 새로운 금융 서비스 프로젝트를 올리기로합니다. 그런데 이러면 문제가 발생하겠죠? 개발을 하고 적용하려니, 기존의 유기견 서비스에서 사용하고 있는 **기술들과 충돌이 발생**할겁니다. 결국 금융 서비스를 도입하지 못하는 상황이 발생합니다.

### 가상화의 등장

그러다 문득, **서버의 성능을 나눠서 사용하면 되지 않을까?** 라는 생각을 하게됩니다. 이것이 바로 가상화라는 개념이 등장하게 된 것이죠.

> 하나의 서버 자원을 나눠서 가지며, 성능을 분산 시키고, 분산된 서버들은 각기 다른 서비스를 수행할 수 있게합니다.

가상화를 통해 사용자가 많은 자원을 할당해주고, 적은 서비스에는 적게 할당할 수 있게 됩니다.

---

## 서버 가상화

이어서 가상화의 종류에 대해 알아봅시다. 여러 종류중에 먼저 서버 가상화를 알아봅시다.

### 서버 가상화란?

![](https://velog.velcdn.com/images/msung99/post/0a53dfa2-60e4-49fd-9305-ad6a09ca2ad0/image.png)

서버 가상화란 **하나의 물리적 서버 호스트에서 여러개의 서버 운영체제를 게스트로 실행할 수 있게 해주는 아키텍쳐**입니다. 보시듯이 하나의 호스트에 여러개의 게스트 OS 가 할당된 것을 확인할 수 있죠?

### 하이퍼바이저

이렇게 생성된 여러개의 운영체제는 가상머신이라는 단위로 구분됩니다. 각 가상머신에는 여러 운영체제가 설치되어 사용되고요.

![](https://velog.velcdn.com/images/msung99/post/9cfd0249-61f4-421e-81a0-89f2714ad06c/image.png)

하이퍼바이저에 의해 생성되고 관리되는 운영체제는 게스트 운영체제(Guest OS) 라고하며, 각 게스트 운영체제는 다른 게스트 운영체제와는 완전히 독립된 공간과 시스템 자원을 할당받아 사용합니다.

하이퍼바이저의 역할을 정리해보면, **하이퍼바이저는 Guest OS들을 생성하고, 각 OS 들에게 자원을 적절히 나누어주며 조율**합니다. 그리고 **각 OS 들의 커널을 번역해서 하드웨어에게 전달**하고요. 대표적인 가상화 툴로 Virtual Box, VMware 등이 있습니다.

### 하이퍼바이저의 한계

이렇게 각종 시스템자원을 가상화하고, 독립된 공간을 생성하는 작업은 반드시 하이퍼바이저를 거치기 때문에, **일반 호스트에 비해 성능 손실이 발생**합니다.

또한 **가상 머신에는 게스트 OS를 사용하기 위한 라이브러리, 커널등을 전부 포함**하기 때문에 배포하기 위한 이미지로 만들었을 때 크기 또한 커집니다.

> 즉, 가상 머신에는 완벽한 운영체제를 생성할 수 있는 장점은 있지만 성능이 느리고, 용량상으로 부담이 있습니다.

---

## 컨테이너 기반 가상화

![](https://velog.velcdn.com/images/msung99/post/b3d3309b-b4c7-4e36-bcca-c72927598dfc/image.png)

앞서 살펴본 서버 가상화 방법은 작은 애플리케이션을 구동하는데 OS 까지 새로 띄우는 것이 부담스러울 수 있습니다. 이를 해결하기 위해 컨테이너가 등장했습니다.

### 프로세스 단위 격리환경

컨테이너는 가상화된 공간을 생성하기 위해 리눅스 자체 기능으로 chroot, 네임스페이스, cgroup 을 사용함으로써 **프로세스 단위의 격리 환경을 만듭니다.**
보시듯이 도커 엔진 위에 컨테이너가 할당된 것을 확인할 수 있습니다.

컨테이너 안에는 애플리케이션을 구동하는데 필요한 **라이브러리 및 실행 파일만 존재**합니다. 따라서 이미지로 만들었을 때 이미지의 용량 또한 가상머신에 비해서 대폭 줄어들죠.

> 따라서 이미지를 만들어 배포하는 시간이 가상머신에 비해 빠르며, 가상화된 공간을 사용할 때 성능 손실도 거의 없다는 장점이 있습니다.

---

## 컨테이너

### 컨테이너를 왜 써야할까?

앞서 서버 가상화와, 컨테이너 가상화의 장단점을 살펴봤습니다. "컨테이너를 왜 써야할까? 라는 질문에 어떻게 대답할 수 있을까요?

> 음.. "가상머신에 비해 가볍고, 빠르니까 쓰지 않을까?"

이렇게 대답할 수 있을것 같은데, 아직 컨테이너가 무엇인지 제대로 햇갈릴겁니다. 조금 더 자세히 알아봅시다.

### 컨테이너란 : 사전적 의미

컨테이너는 사전적 의미로 어떤 물체를 격리하는 공간을 뜻합니다. **각각의 컨테이너는 격리된 상태로 다른 컨테이너들과 분리되어있죠.** 그렇다면 기술적 의미에서의 컨테이너는 무엇을 의미할까요?

### 컨테이너란 : 기술적 의미

저희가 흔히 알고있는 컨테이너는, **컨테이너에 담긴 것들의 생명주기(life cycle) 들을 관리**합니다. 무언가의 생성, 운영, 제거까지의 생명주기를 얘기합니다.

> - 가상화 관점에서의 컨테이너란 이미지의 목적에 따라 생성되는 프로세스 단위의 격리 환경입니다.

- 이미지는 간단히 컨테이너를 만들기위한 틀이라고 생각하고 넘어갑시다.

---

## 컨테이너 구조 뜯어보기

컨테이너는 환경을 제공하며 프로세스의 생명주기를 관리합니다. 예를 들어봅시다. 스프링부트 애플리케이션과 Nginx 애플리케이션을 컨테이너를 통해 실행해보려고 합니다. 여기서 이미지의 목적은 스프링부트 애플리케이션, Nginx 애플리케이션입니다.

보시듯이 컨테이너는 파일시스템과 **격리된 시스템 자원 및 네트워크를 사용할 수 있는 독립된 공간을 가집니다.** 컨테이너가 실행되며, 프로세스가 실행되기에 필요한 자원들을 할당받고 프로세스를 실행합니다.

![](https://velog.velcdn.com/images/msung99/post/57b13568-ddc7-414d-b73c-02d2dac02536/image.png)

또한 프로세스라는 것은 운영체제 위에서 실행되겠죠? 이 운영체제를 Host OS 이라고 표현합니다.

### Host OS

그렇다면 Host OS 입장에서는 컨테이너를 어떻게 바라볼까요? 앞서 말했듯이 **컨테이너는 프로세스의 생명주기를 관리하며 실행하는 하나의 프로세스**라고 말할 수 있습니다. 즉 스프링부트 애플리케이션 프로세스를 직접 실행하나, 컨테이너로 실행하나 Host OS 입장에서는 똑같은 평범한 프로세스로 본다는 말입니다.

마치 앞선 컨테이너 구조는, Host OS 입장에서는 아래와 같은 상황과 동일한것이죠.

![](https://velog.velcdn.com/images/msung99/post/66a7e5e6-f988-4630-8289-479dc5e13017/image.png)

---

## Docker Engine(도커 엔진)

그렇다면 컨테이너를 어떻게 관리할 수 있을까요? 사용자는 도커엔진이라는 것을 통해 컨테이너를 관리할 수 있습니다.

**도커엔진이란 유저가 컨테이너를 쉽게 사용할 수 있게해주는 주체입니다.**
역할을 정리해보자면 다음과 같습니다.

> - 컨테이너 관리 : 컨테이너를 생명주기를 관리합니다.

- 이미지 관리 : 컨테이너를 생성하기 위한 이미지를 관리합니다.
- 볼륨 관리 : 컨테이너의 데이터를 저장하기 위한 저장소 역할을 하는 볼륨을 관리합니다.
- 네트워크 관리 : 컨테이너의 접속을 관리하기 위한 네트워크를 관리합니다.

---

## 도커엔진 : 명령어 입력시 로직

사용자가 도커 관련 명령어를 입력했을때 어떠한 플로우로 진행될까요?

![](https://velog.velcdn.com/images/msung99/post/27ad5f3f-03d6-4e9f-af0f-6aa343e443d5/image.png)

1.먼저 사용자는 도커 명령어로 도커 엔진에게 명령어를 보냅니다.

2.이를 전달받은 도커 클라이언트는 /var/run/docker.sock 에 위치한 유닉스 소켓을 통해 도커 데몬의 API 를 호출합니다.

3.도커 데몬은 명령어에 해당하는 작업을 수행하고, 도커 데몬의 API 를 호출합니다.

4.도커 데몬은 명령어에 해당하는 작업을 수행하고, 수행 결과를 도커 클라이언트에게 반환하면 사용자에게 결과를 출력합니다.

### 도커 데몬, dockerd 이란?

이때 dockerd 는 컨테이너를 생성하고 실행하며 이미지를 관리하는 주체입니다.
또 도커 프로세스가 실행되어 입력을 받을 준비가 된 상태를 도커 데몬이라고 합니다.

---

## 정리

지금까지 알아본 것중 핵심만을 정리해봅시다. 저희는 가상화의 필요성과 종류에 대해 알아봤고, 가상화 종류중에 컨테이너 가상화를 사용하는 이유에 대해 알아봤습니다.

![](https://velog.velcdn.com/images/msung99/post/4a405bf7-221a-4c75-8cd3-e000f8f9a23f/image.png)

또한 프로세스의 생명주기를 관리하는 가상화 기술을 컨테이너에 대해 알아봤습니다. 이어서 컨테이너의 생명주기를 관리하는 도커엔진에 대해 알아봤습니다.

---

## 마치며

지금까지 가상화란 무엇이며, 가상화 종류중 컨테이너 가상화를 자세히 다루어보면서 도커 명령어를 입력시 어떻게 플로우가 돌아가는 것인지에 대해 내부 메커님즘을 알아봤습니다.

또한 지금까지는 단인 서버에서의 단일 도커 엔진에 대해 다루어봤는데, 다음 포스팅에서는 여러개의 서버의 도커 엔진에 대해 다루어볼까합니다 😁

---

## 참고

https://docs.docker.com/

.
