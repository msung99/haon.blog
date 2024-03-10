---
title: 도커를 이용해 EC2 서버에 배포하기
date: "2023-01-05"
tags:
  - 배포
  - Docker
---

## EC2 서버에 Docker 이미지가 올라가는 과정

![](https://velog.velcdn.com/images/msung99/post/801226c6-c63b-4a8f-a16b-147f8a19888b/image.png)

본격적인 시작전에, 어떻게 Docker 로 생성한 이미지가 컨테이너에 감싸져서 배포가 이루어지는지 알아봅시다.

우선 본인의 로컬에서 진행한 프로젝트 내용이 있을겁니다. 해당 프로젝트의 내용을 하나의 jar 파일로 압축시킨 후, 이를 Dockerfile 를 통해 이미지화 시킨 후 DockerHub 에 push 하는 겁니다.

그 후 클라우드 EC2 서버에서 직전에 push 했던 도커 이미지를 내려받은 후(pull), Docker run을 통해 해당 이미지를 감싸고 있는 도커 컨테이너를 실행시켜서 서버를 배포시키는 방식입니다.

---

## jar 파일을 빌드하기

![](https://velog.velcdn.com/images/msung99/post/a9f2fb8e-a3b9-4e13-900e-f689cbd182bc/image.png)

gradle 의 bootJar 라는 것이 있습니다. 이를 활용해 jar 파일을 빌드해주셔야 합니다.

### jar 파일이란?

jar 파일을 여러개의 클래스 파일들과 관련 리소스 및 메타 데이터를 하나의 파일로 모아서 배포를 위해 만들어진 SW 패키지 파일 포맷입니다. 또 jar는 zip 으로 이루어진 압축 파일입니다.

빌드에 성공하셨다면 아래와 같이 build/libs 디렉토리에 jar 파일이 성공적으로 빌드된 모습을 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/a9daed4d-8648-4c32-a7fb-62da4c54b168/image.png)

---

## DockerFile 생성하기

다음으로는 DockerFile 을 생성할 차례입니다. 도커 파일이란 **도커 이미지를 생성하기 위한 DSL으로서 몇가지 명령어들 커스텀 이미지를 만들 수 있게 해줍니다.**

![](https://velog.velcdn.com/images/msung99/post/17e9dbf2-938c-4e5d-a91c-5815e6d88aec/image.png)

Dockerfile 은 직전에 생성한 jar 파일이 위치한 곳, 즉 build/libs 파일에서 생성되어야 합니다. 따라서 이 경로로 이동하여 Docker 파일을 작성해주도록 합시다.

```
cd /build/libs
ls
```

도커파일의 내용은 아래와 같습니다.

```
FROM openjdk:11
ARG JAR_FILE=*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

- FROM : 기반이 되는 이미지를 의미하고, jdk 11 버전을 사용함을 명시했습니다.

- ARG : 컨테이너 내에서 사용할 수 있는 변수를 지정할 수 있습니다. 즉, 여기서는 확장자가 " .jar " 인 변수(파일)을 Docker 컨테이너에서 사용하겠음을 명시한 것입니다.
- COPY : ARG의 JAR_FILE 변수를 컨테이너의 app.jar에 복사한다는 뜻입니다.
- ENTRYPOINT : 컨테이너가 시작됐을 떄 실행할 스크립트를 명시합니다. 직전에 COPY 를 통해 app.jar 에 카피한 jar 파일을 도커 컨테이너가 시작됐을 때 실행하기 위해 명시한 것입니다.

---

## Docker Image 생성

다음으로 도커 이미지를 생성할 차례입니다. Dockerfile을 빌드해줌으로써 도커 이미지가 생성되는데, 터미널에 Dockerfile이 있는 위치에서 다음 명령어를 써주면 Dockerfile이 빌드가 됩니다.

```
docker build -t '도커에 가입한 본인의 계정'/'프로젝트명':'버전' '경로'
```

![](https://velog.velcdn.com/images/msung99/post/2c85a779-a95a-477b-b80b-9a46b5d73d7d/image.png)

```
docker build `옵션` `도커에가입한 계정`/`프로젝트명`:`버전` `경로`
>>> docker build -t msung99/maestroproject:0.1.0 .
```

이때 맥북 M1 칩을 사용하시는 분들을 주의하셔야 할 사항이 있습니다. 현재 본인이 사용중인 맥북이 Apple M1칩이라면 도커가 해당 이미지를 빌드할때 생성된 빌드 플랫폼이 클라우드 서버(linux) 와 m1 맥북간의 호환성이 안맞는 문제가 발생합니다.

맥북 m1 의 경우 아래의 명령을 통해 호환성을 맞춰주도록 사전에 제대로 이미지를 빌드해주도록 합시다.

```
docker build -platform linux/amd64 -t `도커에가입한 계정`/`프로젝트명`:`버전` `경로`
```

이미지가 정상적으로 생성되었는지는 아래와 같이 확인할 수 있습니다.

```
docker images    // 모든 도커 이미지 조회
```

![](https://velog.velcdn.com/images/msung99/post/7933c85c-9ceb-4656-b45c-e0a16b904e50/image.png)

---

## DockerHub 레포지토리에 push

이제 도커허브에 이미지를 올릴 차례입니다. 도커허브의 레포지토리에 방금 생성한 이미지를 push 하고, 추후 클라우드 서버에서 해당 레포지토리로 부터 도커 이미지를 가져오는 방식입니다.

```
>>> docker push '이미지명'

docker push msung99/maestro:0.1.0
```

도커허브에서 해당 레포지토리에 접속하시면 정상적으로 이미지가 push 된 모습을 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/88e37c2b-26ff-4eb9-ae34-a0673352ceec/image.png)

---

## EC2 클라우드 서버에 Docker 설치하기

이제 EC2 서버에 도커를 설치하고, 아까 도커허브에 올렸던 도커 이미지를 pull 받은 후 이 서버에서 스프링부트 프로젝트를 실행시키면 됩니다. 아래와 같이 도커를 위한 환경셋팅을 진행해줍시다.

참고로 저는 Ubuntu18.04 LTS 버전을 기반으로 클라우드 서버를 구축했습니다.

- EC2 서버 구축하는 방법은 이번 주제에 너무 벗어나는 내용이니, 설명은 제외하도록 하겠습니다.
- 만일 sudo 를 매번 타이밍하는 것이 번거롭다면 아래 설치 과정 이전에 "sudo su" 를 명령하여 sudo 를 매번 타이밍하는 일이 없도록 합시다.

```
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce
```

---

## Docker Image pull

직전에 설명드렸듯이 이제 도커 이미지를 레포지토리로부터 서버에 내려받으면 됩니다. 아래와 같이 내려받도록 해줍시다.

```
sudo docker pull '레포지토리명'

sudo docker pull msung99/maestro:0.1.0
```

아래와 같이 pull 을 정상적으로 실행했다면 성공입니다!

![](https://velog.velcdn.com/images/msung99/post/f8ff4fd8-9bdd-434f-bc0c-276b3c4c1880/image.png)

---

## 도커 컨테이너 실행시키기 (1)

마지막 단계입니다. 내려받은 도커 이미지를 컨테이너에 감싸서 실행시켜주면 끝입니다.

![](https://velog.velcdn.com/images/msung99/post/0f15a3d1-2631-4d95-b6c3-970f506944b2/image.png)

```
sudo docker run --name '컨테이너명' -d -p '호스트 포트':'컨테이너 포트' '레포지토리명'
```

```
sudo docker run --name 'container' -d -p 8080:8080 msung99/maestro:0.1.0

docker build --platform linux/amd64 -t msung99/maestro:0.1.0 .
=> 두번째는 맥북 m1 칩의 경우일때 실행하면 됩니다. 아까 말씀드렸던 호환성 문제 때문입니다.
```

---

## 도커 컨테이너 실행시키기 (2)

또는 아래와 같이 실행시킬 수도 있습니다.

```
docker run -p 호스트 포트':'컨테이너 포트' '레포지토리명'

docker run -p 9001:9001 msung99/maestro:0.1.0
```

![](https://velog.velcdn.com/images/msung99/post/5fe821a4-3540-49b2-8b48-227b6d09f6b5/image.png)

---

## Docker 컨테이너 STATUS 조회

이렇게까지 잘 따라해주셨다면 도커 이미지가 컨테이너에 감싸서 정상적으로 실행되고 있을겁니다. 혹시 모르니 정상적으로 실행되고 있는지를 확인해보고 싶다면, 아래와 같은 명령를 통해 컨테이너의 상태를 조회해봅시다.

```
docker ps -a
```

![](https://velog.velcdn.com/images/msung99/post/00d1595f-6c95-482f-b9c8-003c929a023c/image.png)

만일 STATUS 가 EXITED 라면 정상 실행되지 않은 것으로, 어떤 문제가 발생했는지 다시 확인해봐야 합니다. 방금 생성한 도커 컨테이를 삭제시켜주고, 각자 발생한 문제를 해결하고 와야합니다.

- 삭제하려는 도커 컨테이너가 만일 실행중인 경우 stop 을 해주고 삭제 시켜줘야합니다.

```
docker stop container
docker rm container
```

---

## 정상 실행 조회

아래와 같이 생성한 IP주소를 9001번 포트로 접속해보면 정상적으로 서버가 구축되었음을 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/fd3e4698-7945-4980-9410-1ef6c26b99d9/image.png)

---

## 마치며 & 더 공부해볼 내용

이렇게 로컬에서 작업했던 스프링부트 프로젝트를 도커를 통해 EC2서버에 배포하는 과정까지 다루어보았습니다. 다만 현 포스팅에서 내용을 담지못해 아쉬웠던 점은 다음과 같습니다.

> - 도커란 무엇인가?

- 호스트 포트와 컨테이너 포트란 무엇이며, 둘의 차이는 무엇인가?
- 호환성 : 맥북 m1에 기반한 서버는 왜 linux amd64 서버와 호환이 안되는가?

이번에 도커를 학습하며 함께 학습했던 내용이나, 위 내용들을 모두 다루기엔 포스팅 내용이 너무 길어진다 판단하여 추후에 다루기로 결정했습니다.

궁금하신 점이나 도움을 받고 싶은 내용이 있다면 댓글로 남겨주시면 도와드리겠습니다.

---

## 참고

[[Docker](이미지 플랫폼 관련 에러 The requested image's platform (linux/arm64/v8) does not match the detected host platform (linux/amd64) ...](https://sas-study.tistory.com/425)
[Django-Docker로-배포하기#5-도커이미지를-도커허브에-푸시하기git-push랑-비슷](https://velog.io/@wind1992/Django-Docker%EB%A1%9C-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0#5-%EB%8F%84%EC%BB%A4%EC%9D%B4%EB%AF%B8%EC%A7%80%EB%A5%BC-%EB%8F%84%EC%BB%A4%ED%97%88%EB%B8%8C%EC%97%90-%ED%91%B8%EC%8B%9C%ED%95%98%EA%B8%B0git-push%EB%9E%91-%EB%B9%84%EC%8A%B7)
[[Docker] 도커에서 Container 포트와 Host 포트의 개념](https://so-es-immer.tistory.com/entry/%EB%A7%A5-mac%EC%97%90%EC%84%9C-%EB%8F%84%EC%BB%A4-%EC%97%90%EB%9F%AC-Cannot-connect-to-the-Docker-daemon-%EC%96%B4%ED%94%8C%EB%A6%AC%EC%BC%80%EC%9D%B4%EC%85%98-%ED%82%A4%EC%9E%90)
[Docker를 이용한 Spring 프로젝트 배포](https://rkdals213.tistory.com/32)
[Spring jar 배포](https://galid1.tistory.com/428)
[]()
[]()
