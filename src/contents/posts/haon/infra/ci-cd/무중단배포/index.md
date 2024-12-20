---
title: 무중단 배포 아키텍처의 다양한 배포전략 (Blue/Green, Rolling, Canary)
date: "2024-10-07"
tags:
  - 무중단배포
  - 로드밸런싱
  - 블루그린
  - 롤링
  - 카나리
previewImage: infra.png
series: CI/CD 무중단배포 아키텍처 개선 과정
---

## 애플리케이션의 종료시점 : 서버 1대로 운영할때

![](https://velog.velcdn.com/images/msung99/post/23b1930d-f6bd-4a22-a105-b0e04a51a6b1/image.png)

서비스를 운영하다보면 새로운 버전을 출시하고 해야할 상황이 발생합니다. 그런데 만약 1대로 운영할때 사용자들이 도중에 중단되는 일 없이 운영이 가능할까요?

현재 서버에는 ver1 버전을 운영하고 있는 상황이고, ver2 버전을 새롭게 배포하고 싶은 상황이라고 가정해봅시다. 앞으로 사용자들은 ver2 를 사용할 수 있도록 배포해야겠죠?

### 서버 1대를 운영시 발생하는 문제점 : 무중단 배포가 불가능하다.

배포를 하려면 우선 새롭게 만든 ver2 버전을 다운로드해야합니다. 문제는 ver1 과 ver2 모두 동일한 포트를 사용하기 때문에 ver2 를 빌드하고 실행하기전에 현재 운영중인 ver1 버전은 잠시 서버를 꺼놓아야합니다.

결국 서비스 사용자는 ver1 를 종료시킨후, ver2 를 빌드하고 다시 서비스를 배포하기전까지 온전히 이용할 수 없을겁니다. ver2 가 배포 완료된 후에나 다시 정상적인 이용이 가능해지겠죠.

여기서 문제는 **서버 1대로만 서비스를 운영하면, 기존 버전으로 돌아가던 서버는 잠시 종료되고, 다음 버전을 다시 배포하기 전까지 사용자를 서비스를 이용할 수 없게됩니다.**

> 다운타임(Downtime) : 이렇게 서비스가 잠시 중단되어야 하는 시간대를 다운타임이라고 부릅니다.

### ver1 서비스를 꼭 중단시켜야 ver2 를 실행시킬 수 있는가?

동일한 포트를 사용한다고 하면 당연한 말입니다.

예를들어 Docker 컨테이너를 띄울때, "docker run -p 8080:8080 이미지명" 을 입력할겁니다. 즉 8080 포트를 특정 컨테이너가 사용중일때 다른 컨테이너를 8080포트를 중복으로 사용할 수는 없을겁니다.

---

## 서버를 2대로 늘린다면? : 로드밸런싱이 필요한 이유

그렇다면 서버를 2대 이상으로 늘려서 확장시키면 다운타임(DownTime) 시간대에 대한 문제가 해결 되는걸까요? 정확히 말하자면, 무작정 서버를 늘린다고 해결되는 것은 아닙니다.

![](https://velog.velcdn.com/images/msung99/post/08046d63-96b6-429c-92f0-b66611dd5d3c/image.png)

그냥 무작정 서버를 늘릴경우, 다음과 같은 문제점이 발생하빈다.

- 사용자가 모든 서버의 IP 를 알고있어야지 리소스를 요청 가능합니다.

- 만일 사용자가 어떻게 해서라도 서버 IP 들을 알아낸다고 한들, 어떤 서버가 현재 운영중인 버전에 대한 서버의 IP 인지 알 수 없습니다.

따라서 저희는 로드밸런싱을 진행해서, 클라이언트와 서버 사이에서 중계해줄 Reverse Proxy 서버를 별도로 배치해주어야 합니다. 한 서버에 요청이 들어오면, 그 서버의 뒷단에 있는 여러 서버중에서 적절한 특정 서버에다 요청을 분산해주는 것이죠.

만일 로드밸런싱와 Proxy 에 대해 아직 잘 모르시는 분들은 제 지난 포스팅을 참고하시면 좋을듯합니다.

- [Proxy Server와 로드밸런싱, 수평확장(Scale Out)과 수직확장(Scale Up)에 대해](https://velog.io/@msung99/%ED%94%84%EB%A1%9D%EC%8B%9C-%EC%84%9C%EB%B2%84Forward-Proxy-Reverse-Proxy-%EC%99%80-Load-Balancer-%EB%9E%80)

---

## 무중단 배포

무중단 배포는 **서비스가 중단되지 않는 상태로 새로운 버전을 사용자에게 계속해서 배포하는 것**입니다.

![](https://velog.velcdn.com/images/msung99/post/4476bf92-d893-440e-97e6-f553dd75e713/image.png)

**무중단 배포를 진행하려면 서버를 2대 이상 확보해야합니다.** 그러고 Nginx 와 같은 웹서버를 앞단에 배치시켜서 한 곳에서 모든 클라이언트들의 요청을 받도록 해야합니다. (Reverse Proxy 서버 앞단에 배치)

그러고 뒷단에 존재하는 여러 서버들에게 상황에 따라 적절히 요청을 분배시키는 방식인 것이죠. (로드밸런싱 진행)

지금부터 무중단 배포 전략을 사용하기 위한 다양한 배포방식을 알아보겠습니다.

---

## 롤링(Rolling)

일반적인 배포 방식을 의미하며, 단순하게 서버를 구성하여 배포하는 전략입니다.

> 다시말해 구 버전에서 신 버전으로 **점진적으로 서버 하나씩 차근차근 전환하는 배포입니다.**

예를들어 다음처럼 운영중인 ver1 버전의 서버 3대가 있을때, 모두 ver2 버전으로 바꿔야하는 경우입니다.

![](https://velog.velcdn.com/images/msung99/post/879a249f-eae3-4f53-9f9a-6d6cc24eb14c/image.png)

점진적으로 서버 하나씩 버전을 바꾼다고 했었죠? 과정을 나열해보면 다음과 가습니다.

1. 우선 서버1에 클라이언트들이 요청을 못하도록 로드밸런서와 연결을 끊습니다.

![](https://velog.velcdn.com/images/msung99/post/d88220d1-9647-4cbc-89d5-236edb56c74b/image.png)

2. 서버1의 버전을 ver2 로 업데이트 합니다. 이떄 서버1은 잠시 중단된 상태일텐데, 클라이언트의 요청들은 서버 2와 3에서 수용하고 있는 상황입니다.

![](https://velog.velcdn.com/images/msung99/post/7657b76c-594e-4653-9791-d037d3599ac8/image.png)

3. 서버1이 ver2 버전으로 바뀌었다면 다시 로드밸런서와 연결을 맺어줍니다.

![](https://velog.velcdn.com/images/msung99/post/253f1cc1-acd9-4cdb-b1ef-4a519f6a8f95/image.png)

4. 이 과정을 서버2 와 3에 대해서도 동일하게 순차적으로 진행해줍니다. 이렇게 서버 하나씩 점차적으로 진행나가는 방식이 Rolling 배포전략입니다.

![](https://velog.velcdn.com/images/msung99/post/594158f3-7bdf-4f39-868c-4db98022a768/image.png)

### 장점

- 많은 서버 자원을 확보하지 않아도 무중단 배포가 가능합니다.
- 점진적으로 새로운 버전이 사용자에게 출시되므로 안정적인 배포가 가능해집니다.

### 단점

- 배포 중 서버 인스턴스의 수가 감소되므로, **다른 서버가 대신하여 감당해야할 트래픽의 양이 늘어납니다.** 따라서 각각의 서버가 처리해야할 용량을 미리 고려하는 것이 좋습니다.

- 구버전과 신버전의 애플리케이션이 동시에 서비스되기 떄문에 **호환성 문제가 발생**할 수 있습니다.

---

## 블루 그린(Blue Green)

**현재 운영중인 구 버전 서버를 블루**, **신 버전 서버를 그린**이라고 부릅니다.

> 신버전에 대한 새로운 인스턴스들을 생성 및 배포해서, 로드밸런서를 구버전과 신버전 모두와 일제히 연결시킵니다. 그러고 기존 구버전을 종료시키고 로드밸런서가 신버전만을 바라보게 하는 전략입니다.

다음과 같이 로드밸런서가 구버전 서버1,2,3 과 연결된 상태라고 해봅시다.

![](https://velog.velcdn.com/images/msung99/post/888c0f23-6684-4af7-8f0c-7e2a205afa3a/image.png)

새롭게 신버전에 대한 서버 인스턴스 3개를 배포하고, 로드밸런서가 신버전 서버와도 동시에 연결됩니다.

![](https://velog.velcdn.com/images/msung99/post/d9974b31-b2cf-4565-b5e5-845b1f74a3c0/image.png)

마지막으로 기존에 연결된 구버전 서버를 종료시킨후, 연결을 끊습니다. 결과적으로 로드밸런서는 신버전 서버들과 연결된 상태가됩니다.

![](https://velog.velcdn.com/images/msung99/post/f0e8e348-4743-4a02-ace0-b5b3f3250d5f/image.png)

### 장점

- 롤링 배포전략과 달리 한번에 트래픽을 신버전으로 옮기기 떄문에 호환성 문제가 발생하지 않습니다.

- 빠른 롤백이 가능하고, 운영환경에 영향을 주지않고 실제 서비스 환경으로 신 버전 테스트가 가능합니다.

### 단점

- 시스템 자원이 2배로 필요하게되어, 비용이 훨씬 발생합니다. 즉, 실제 운영에 필요한 서버 리소스에 대비해 2배의 리소스를 확보해야합니다.

---

## 카나리(Canary)

카나리 배포는 위험을 빠르게 감지할 수 있는 배포전략입니다. **지정한 서버 또는 특정 User 에게만 배포해서 서비스를 운영하다가, 버그가 없고 정상적이라고 판단되면 전체에게 배포하는 방식입니다.**

> 즉, 서버의 트래픽을 일부를 신 버전으로 분산하여 오류 여부를 확인해보는 전략입니다.

![](https://velog.velcdn.com/images/msung99/post/d561c87a-2cfe-4ce6-99e1-942b386c2fbb/image.png)

이떄 트래픽을 새로운 버전으로 옮기는 기준은 랜덤으로 진행하거나, 또는 팀원들과 정한 규칙(ex. Admin 유저만 신버전으로 배포해보자) 에 따라서 진행하면됩니다.

또한 이런 배포전략으로 A/B 테스트도 가능합니다.

### 장점

- 트래픽 비율을 조정해서 버그 테스트를 안정적으로 진행가능합니다.

### 단점

- 롤링 배포전략과 마찬가지로 호환성 문제가 발생할 수 있습니다. 일부는 신버전, 다른 사람들은 신버전을 사용하기 때문이죠.

---

## 마치며

지금까지 무중단 배포의 다양한 전략에 대해서 알아봤습니다. 만약 본인이 진행중인 아키텍쳐에 무중단 배포를 도입한다면, 위와 같은 다양한 배포전략중에서 상황에 맞게 적합한 것을 선택하시면 좋을것 같습니다 🙂

---

## 참고

[무중단 배포란? 무중단 배포를 위한 환경 이해하기](https://velog.io/@znftm97/%EB%AC%B4%EC%A4%91%EB%8B%A8-%EB%B0%B0%ED%8F%AC%EB%A5%BC-%EC%9C%84%ED%95%9C-%ED%99%98%EA%B2%BD-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0#-span-stylecolor0b6e99%EB%AA%A9%ED%91%9Cspan)
[Samsung SDS : 무중단 배포 아키텍처(Zero Downtime Deployment)- 글로벌 서비스 운영의 필수 요소](https://www.samsungsds.com/kr/insights/1256264_4627.html)

.
