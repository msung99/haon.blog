---
title: Jenkins 와 Docker를 활용한 배포 자동화 구축하기
date: "2023-01-09"
tags:
  - 배포
  - Docker
  - Jenkins
previewImage: infra.png
series: CI/CD 무중단배포 아키텍처 개선 과정
---

## 왜 Jenkins 를 사용하게 되었는가?

지난 포스팅 [[Docker] SpringBoot 스냅샷 jar 파일을 도커를 이용해 EC2 서버에 배포하기](https://velog.io/@msung99/Docker-%EB%8F%84%EC%BB%A4%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EC%8A%A4%ED%94%84%EB%A7%81-%EB%B6%80%ED%8A%B8-SNAPSHOT-jar-%ED%8C%8C%EC%9D%BC-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0) 에서는 로컬에서 개발한 스프링부트 프로젝트를 "수동"으로 직접 Docker Image 를 빌드하고, 도커허브에 올린후에 EC2 서버에서 도커 이미지를 직접 가져와서 컨테이너를 실행시키는 방식으로 배포를 진행했습니다. 현재 진행중인 사이드 프로젝트에서도 수정사항이 생길때마다 매번 이미지를 빌드하고 다시 배포하는 방식을 진행했었습니다.

그러나 **개발자가 매번 직접 도커 이미지를 빌드하고, 도커 허브에 올리고, 클라우드 서버에 땡겨와서 배포하는 방식은 정말 불편하다고 느껴졌습니다.** 따라서 배포 자동화에 관한 학습을 진행하다가, CI/CD 를 접하게 되었고 이렇게 학습을 시작하게 되었습니다.

---

## 어떻게 자동화 배포 서버를 구축할 것인가?

![](https://velog.velcdn.com/images/msung99/post/bee77b1d-0304-461f-9061-e1d8505dab38/image.png)

위와 같은 배포 자동화 시스템을 구축할 예정입니다. Jenkins 와 Docker를 사용해 어떻게 배포가 자동화 되는지를 먼저 간단히 나열해보자면 아래와 같습니다.

- 로컬에서 작업한 내용을 Jenkins와 연동된 깃허브 원격 레포지토리에 push 합니다.

- Webhook : 새롭게 push된 내용을 기반으로 Jenkins 서버에서 Gradle 을 통해 build를 실행합니다.

- Gradlew build 를 통해 Jar 파일이 자동 생성되고, 해당 jar파일을 기반으로 도커 이미지가 자동으로 빌드됩니다.

- 생성된 도커 이미지는 본인의 DockerHub 에 push됩니다.

- SpringBoot 프로젝트를 배포할 EC2 서버에서 직전에 도커허브에 올라간 도커 이미지를 pull 받아옵니다.

- 내려받은 도커 이미지를 기반으로 컨테이너에 감싸서 해당 프로젝트를 실행시켜줍니다.(docker run)

---

## Dockerfile 작성

우선 스프링부트 프로젝트에 도커파일을 작성했습니다. 이를 기반으로 빌드를 하고, 이미지를 실행해야겠죠?

![](https://velog.velcdn.com/images/msung99/post/ff6e8c11-ba2f-47af-8be0-6b8c3397d299/image.png)

위와 같이 루트 디렉토리에 도커파일을 위치시켰고, 또 아래아 같이 도커파일을 구성해줬습니다.

```
FROM openjdk:11-jdk
LABEL maintainer="email"
ARG JAR_FILE=build/libs/core-0.0.1-SNAPSHOT.jar
ADD ${JAR_FILE} docker-springboot.jar
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/docker-springboot.jar"]
```

---

## Jenkins 서버 환경구축

우선 Jenkins 서버에 도커를 설치해주고, Jenkins 이미지를 내려받고 서버를 실행시켜줄 겁니다. 아래와 같이 따라해줍시다.

#### 1. Docker 설치

```
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce
```

#### 2. Jenkins Image Pull + Run

다음으로 젠킨스 이미지를 도커허브로부터 내려받고, 해당 이미지를 컨테이너로 감싸서 실행시켜줍시다. 아래와 같이 해주세요!

```
docker pull jenkins/jenkins:lts
docker run --privileged -d -p 8080:8080 -p 50000:50000 --name jenkins jenkins/jenkins:lts
```

##### 2023.01.09 내용 추가

아래 방법은 사용하지 마세요..! 계속 제가 포스팅한 내용은 따라하시다보면 알겠지만, 나중에 권한문제로 에러가 계속 발생합니다! 위의 내용으로 docker run 을 해주세요!

```python
docker pull jenkins/jenkins:lts
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins jenkins/jenkins:lts
```

- 이때 젠킨스 서버는 기본적으로 8080포트를 기반으로 접속 가능하기 때문에, **컨테이너 포트를 8080 으로 실행**시켜주시켜야 한다는 점을 유의해주세요!

#### 3. Jenkins 초기 관리자 비밀번호

![](https://velog.velcdn.com/images/msung99/post/3436814c-7719-42aa-b81c-2fa66bb9aa71/image.png)

jenkins의 초기 관리자 비밀번호를 요구하는 화면입니다.

해당 경로(/var/jenkins_home/secrets/initialAdminPassword)에 있는 파일의 내용을 읽어서 Administrator password 란에 입력해주면됩니다.

이 파일은 docker volume을 사용하지 않았다면, docker 내부에만 존재하는 파일이므로 아래와 같은 명령어를 입력하여 jenkins container에 접근해야합니다.

```python
docker exec -it jenkins /bin/bash
```

docker container 내부 쉘에서

```python
cat /var/jenkins_home/secrets/initialAdminPassword
```

을 입력하면 초기 관리자 비밀번호가 출력되게 됩니다.

#### 4. Jenkins 관련 플러그인 설치

![](https://velog.velcdn.com/images/msung99/post/6be7b760-5623-4d20-81e0-37692cd6a832/image.png)

앞서 인증에 성공했다면, 위와 같은 화면이 나올텐데 어떤 방식으로 플러그인을 설치할 것인지 선택하는 란이 나오게 되는 것입니다. 저희는 Install suggested plugin 을 선택하여 필수적인 플러그인들을 모두 설치받도록 해줍시다.

#### 5. 관리자 계정 생성

플러그인 설치가 완료되면 어드민 계정을 생성하는 페이지가 나오게됩니다. 생성을 하시면 Jenkins 메인 페이지가 나오게 됩니다! 여기까지하면 기본 셋팅은 완료된 것입니다.

---

## CI 구축 : GitHub 와 Jenkins 연동

- 젠킨스 메인페이지에서 새로운 Item -> FreeStyle Project 를 생성해줍시다.

![](https://velog.velcdn.com/images/msung99/post/3cfda1e5-010a-4234-8c63-8c5339fbaf30/image.png)

가장 먼저 GitHub Project 를 선택해주고, 본인이 연동하고자 할 깃허브 레포지토리 URL 를 넣어줍니다.

![](https://velog.velcdn.com/images/msung99/post/e154d233-19a8-49b3-8a29-94c1736a3f54/image.png)

다음으로 "소스 코드 관리"로 넘어가서, Git 을 선택해주고 마찬가지로 깃허브 레포지토리 URL 를 넣어줍시다. 그러고 Credentials 라는 란이 나오게 되는데, 이는 Jenkins 와 깃허브간에 데이터를 주고받을 때의 인증 방식을 의미하는 것입니다.
보통 현업에서는 SSH-key 인증 방식을 사용하지만, 저희는 임의로 간단한 테스트 프로젝트를 생성하고 연동하는 것이 목표이기 때문에 깃허브 계정 로그인 인증방식을 사용하겠습니다.

맨 처음에는 Credential란에 None 이 뜰텐데, 해당 None 을 클릭후 add 를 클릭하여 본인의 깃허브 계정의 아이디와 비밀번호를 입력해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/83ea20ea-8ada-46fb-9c42-d44c91d0b430/image.png)

다음으로 깃허브에 push가 될때 build 가 실행될 브랜치를 선택할 수 있습니다. 저는 임의로 생성한 테스트 레포지토리에서 메인 브랜치를 master가 아닌 main 브렌치로 설정했기 때문에, main 브랜치로 바꿔줬습니다.

![](https://velog.velcdn.com/images/msung99/post/6d407050-217b-4e8c-8287-dfb65e20fa44/image.png)

그 다음으로 빌드을 어떤 방식으로 진행할지 지정할 수 있는데(build trigger), 저희는 위와 같은 방법을 택하도록 하겠습니다.

### Execute shell 빌드 실행내용

다음으로 build steps 에서 빌드할 내용을 지정해주시면 됩니다. 아래와 같이 작성해줍시다.

```python
chmod +x gradlew
./gradlew clean build
```

![](https://velog.velcdn.com/images/msung99/post/7ebefe89-3bd7-4f70-bf47-6be6b8f17a74/image.png)

- 추가적으로 docker 에 관한 실행 명령이 있는데, 이는 gradlew 파일을 기반으로 빌드하는 것에 대한 주제와 벗어나는 내용이므로 추후에 설명드리도록 하겠습니다.

---

## WebHook 연동 : Github + Jenkins

다음으로는 연동하고자 했던 해당 깃허브 레포지토리에 접속해서 Webhook을 설정해주셔야 합니다. 레포지토리의 Settings -> Webhooks 란으로 들어가줍시다.

![](https://velog.velcdn.com/images/msung99/post/3c58ad5d-32d6-4ec8-800f-1dd680f59f93/image.png)

그리고 Webhook 을 추가해줍시다. 그리고 아래와 같이 구성해주셔야 합니다.

- Payload URL : 젠킨스 IP주소:호스트 포트번호/github-webhook/
- Content type : application/json

```python
Payload URL 포맷 예시
http://123.456.78:8080/github-webhook/

=> 맨 마지막에 github-webhook/ 을 꼭 붙여주셔야합니다!
```

![](https://velog.velcdn.com/images/msung99/post/3a42895c-f28c-4f12-a1fd-b2daa47b61f2/image.png)

- 만일 앞서 Jenkins 에서 설정시 Credentials 를 로그인 인증방식이 아닌, ssh-key 인증방식을 택하셨다면 github Deploy 란에서도 따로 ssh-key 를 등록해주셔야 연동이 가능해집니다! 다만, 저는 이번 테스트에서 앞서 봤듯이 User-password 방식을 택했으므로 ssh-key 를 등록하지 않았습니다.

---

## Jenkins 와 SpringBoot 배포서버 연동

다음으로 스프링부트 프로젝트가 올라가는 EC2 서버와 연동을 시켜보는 방법을 알아봅시다. 이때 알고 가셔야 할점은 아래와 같습니다.

> - Jenkins 서버에서 jar파일이 빌드되고 생성된 도커 이미지가 도커 허브에 push 될텐데, 이 도커 이미지를 스프링부트 서버에서 pull 받고 실행시켜야합니다.

---

- **이때 젠킨스 서버와 SpringBoot 서버가 서로 연동이 되어있어야만 도커 허브를 통해 도커 이미지를 옮기는 것이 가능할겁니다.** 이를 가능하게 해주는 작업을 하는 것입니다.

---

- ssh-key 인증방식을 통한 연동을 진행합니다.

### 1. ssh key 생성

배포서버에 접근하기 위해, PEM 형식의 key 를 생성해야합니다.

```python
ssh-keygen -t rsa -C "키명칭" -m PEM -P "" -f /root/.ssh/"키명칭"

ex) ssh-keygen -t rsa -C "mykey" -m PEM -P "" -f /root/.ssh/mykey
```

![](https://velog.velcdn.com/images/msung99/post/6e697e3a-4ea1-413b-8d9a-67b9ff38c9d5/image.png)

저와 똑같이 따라하셨다면 위와 같이 ssh key 가 public, private 2개가 생성된 것을 볼 수 있습니다.

---

### 2. 스프링부트 배포서버 public key 등록

앞서 생성한 key 중에서 public key를 배포서버의 .ssh/authorized_keys 파일에 추가해주셔야 합니다.

```python
// jenkins서버
sudo cat /root/.ssh/[키명칭].pub

ex) sudo cat /root/.ssh/mykey.pub

// 배포서버
vi .ssh/authorized_keys
```

vi 편집기로 authorized_keys 에 접속했다면 앞서 jenkins서버에서 생성한 public key 를 복붙해주시면 됩니다!

- 또한, 만일 authorized_keys 에 Read Only File 이라는 에러 메시지가 뜨면서 저장에 계속 실패한다면 쓰기 권한이 없어서 그런것입니다. authorized_keys 는 보안과 관련한 정말 중요한 파일이므로, 함부로 쓰고 저장하는 것이 안되기 때문이죠.

저장에 실패하시는 분들은 아래 명령을 통해 권한을 풀어주시기 바랍니다.

```
sudo vi .ssh/authorized_keys

// => sudo 관리자 권한으로 authorized_keys 파일 편집하기
```

![](https://velog.velcdn.com/images/msung99/post/86d258cf-65ba-40ec-8f76-671ec0ae2189/image.png)

---

### 3. Publish Over SSH 플러그인 설정

이제 Jenkins의 플러그인을 통해 젠킨스 서버와 스프링부트 서버를 제대로 연동해줄 차례입니다. 앞선 과정은 ssh key 를 등록함으로써 데이터를 주고받을 때 인증하기 위한 과정이였다면, 이 과정은 실질적인 연동과정입니다.

#### 플러그인 설치

Jenkins 관리 > 플러그인 관리 > 설치가능 탭 에서 Publish Over SSH 플러그인을 검색하여 설치하고 젠킨스를 재실행하여 플러그인이 적용 될 수 있도록 해주시면 됩니다!

#### 플러그인 연동

다음으로 Jenkins 관리 > 시스템 설정 > Publish over SSH 로 접속해줍시다. 여기서 스프링부트 서버와 연동을 시도할 수 있는겁니다.

![](https://velog.velcdn.com/images/msung99/post/ebfcd44b-ea93-4d6e-956c-2e9f3f2f6427/image.png)

우선 Passphrase 부분을 채워줍니다. **접속하려는 서버(스프링부트 서버)의 비밀번호**를 입력해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/45b35b4f-06c7-4900-be2a-b56e90525c2d/image.png)

또한, 아래 SSH Servers 에서 "추가" 를 클릭해줍니다. 채워야할 란은 다음과 같습니다.

- Name : 임의의 서버 이름
- HostName : 접속하려는 서버의 IP 주소
- Username : 접속하려는 서버의 로그인 아이디

![](https://velog.velcdn.com/images/msung99/post/e0856e15-1c2f-4771-a37f-fd47c2560271/image.png)

까지 입력하신후, Test Configuration 을 통해 연동을 테스트해봅시다. 위와 같이 Success 가 뜬다면 연동에 성공한 것입니다.

---

## DinD : Jenkins 컨테이너안에 도커 설치 및 권한설정

다음으로 Jenkins 컨테이너 안에 도커를 설치(DinD)하고, 몇가지 권한 설정을 해줄겁니다.

### 권한 문제로 인한 도커 컨테이너 재시작

- 본격적인 시작에 앞서, jenkins 컨테이너 안에서 도커 설치를 하는데 권한 관련 문제가 꽤 많더라구요. 혹시 저와 비슷한 관련 문제를 걲을 분들은 아래와 같은 명령을 통해서 도커 컨테이너를 새롭게 생성하시길 바랍니다.

#### 2023.01.09 내용추가

- 만일 앞서 "--privileged" 옵션을 통해 권한 부여를 이미 해줬다면, 현재 내용은 건너뛰셔도 됩니다!

```python
docker stop '컨테이너 id'    // 해당 컨테이너 실행을 멈추고
docker commit jenkins newjenkinsimages  // 해당 컨테이너에 대한 복사본 커밋 도커 이미지를 생성
docker run --privileged -d -p 8081:8080 -p 50001:50000 --name newjenkins newjenkinsimagemages   // 새로운 컨테이너에서 작업 내용을 그대로 가져와서 재시작
```

![](https://velog.velcdn.com/images/msung99/post/77233c24-5a97-4bc8-b28a-1909642ad5b3/image.png)

정상적으로 실행되었다면, 아래와 같이 jenkins 컨테이너에 접속해주세요!

```python
docker exec -itu 0 'jenkins 컨테이너 id' /bin/bash

ex) docker exec -itu 0 81fba6bc7732 /bin/bash
```

### jenkins 컨테이너에 도커 설치

이제 jenkins 컨테이너에다 도커를 설치해야 합니다.

```
# Docker 설치
## - Old Version Remove
apt-get remove docker docker-engine docker.io containerd runc
## - Setup Repo
apt-get update
apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
## - Install Docker Engine
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

[참고: jenkins 컨테이너 내부에서 도커 실행](https://blog.opendocs.co.kr/?p=704)

다음으로 아래와 같은 명령어를 통해 도커데몬을 실행해주시면 됩니다.

```
service docker start
systemctl start docker
```

[참고 : Docker 수동으로 데몬 시작하기](https://help.iwinv.kr/manual/read.html?idx=583)

---

## Jenkins & Docker 그룹 추가

#### 1. Docker 그룹에 root 계정 추가

```
usermod -aG docker root
su - root
```

#### 2. 그룹에 잘 추가되었는지 확인하기

```
id -nG    // "root docker" 가 뜨면 정상
```

#### 3. docker.sock 권한 변경

```
chmod 666 /var/run/docker.sock
```

#### 4. root 에서 도커 로그인

젠킨스에서 도커허브에 빌드 된 이미지를 푸쉬할 수 있도록 root 유저로 들어가서 도커 로그인을 해주도록 합니다. 여기서 로그인시 입력하는 아이디와 암호는 위에서 가입한 도커허브의 아이디와 암호를 입력하면 됩니다.

```
su - root
docker login
```

만일 root 에서 도커 로그인 시도시에 권한문제로 "su:Authentication Failure" 를 마주했다면, 아래 블로깅을 참고하세요!
(사실 sudo 를 현재 젠킨스 컨테이너 안에 설치해야하는데, 설치 과정을 생략하느라 문제가 발생할 수 있습니다..!)

[참고 - su : Authentication Failure](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=cthu3801&logNo=220710165047)

---

## Docker를 활용해 Jenkins 서버에서 스프링부트 서버로 배포 자동화하기

이제 거의 다 왔습니다. 아까 생성했던 젠킨스 Item (FreeStyle Project) 가 있죠? 거기에 다시 들어가서 docker 와 관련한 명령어들을 작성해야 합니다.

#### 1. docker 이미지 생성 및 도커허브에 push

Build Steps 에서 Add build steps 을 클릭하여 Execute shell 을 추가해줍니다. 그리고 아래와 같이 작성해줍시다.

![](https://velog.velcdn.com/images/msung99/post/1a6d4f68-56ed-449e-9d77-fd12a1f83194/image.png)

```
docker login -u '도커허브아아디' -p '도커허브비번' docker.io
docker build -t [dockerHub UserName]/[dockerHub Repository]:[version]
docker push [dockerHub UserName]/[dockerHub Repository]:[version]
```

#### 2. 스프링부트 서버에서 docker pull 및 이미지 실행시키기

아래와 같이 빌드환경란으로 가서, Send files of execute commands over SSH after the build runs 를 선택해줍니다. 그리고 아래와 같이 스프링부트 서버에서 어떤 동작을 수행할지 정의해주면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/dac6f2d4-a7d2-4294-81c2-3e7e9ab560ea/image.png)

```python
docker login -u '도커허브아아디' -p '도커허브비번' docker.io
docker pull [dockerHub UserName]/[dockerHub Repository]:[version]
docker ps -q --filter name=[containerName] | grep -q . && docker rm -f $(docker ps -aq --filter name=[containerName])
docker run -d --name [containerName] -p 9001:9001 [dockerHub UserName]/[dockerHub Repository]:[version]
```

위의 도커 명령어 각 줄을 해석해보자면 다음과 같습니다.

#### 1. docker pull

- 이전에 젠킨스 서버에서 올려놓은 도커이미지를 스프링부트 서버에서 pull 하는 것입니다.

```python
docker pull [dockerHub UserName]/[dockerHub Repository]:[version]
```

#### 2. docker ps -1 --filter ~~~

- 배포서버에서 도커컨테이너 이름으로 검색하여 있으면 해당 컨테이너를 정지하고 삭제하는 것입니다.

```python
docker ps -q --filter name=[containerName] | grep -q . && docker rm -f $(docker ps -aq --filter name=[containerName])
```

#### 3. docker run

- 새롭게 받아온 도커 이미지를 스프링부트 서버에서 실행시켜주는 것입니다.

```python
docker run -d --name [containerName] -p 9001:9001 [dockerHub UserName]/[dockerHub Repository]:[version]=
```

---

## Build 및 배포 테스트 결과

gradle 파일을 기반으로 성공적으로 빌드가 되는 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/81ff1bfb-7f9b-4981-a04e-9a1f0621a9e2/image.png)

최종적으로 SUCCESS 라는 결과를 확인할 수 있게 되었습니다!

![](https://velog.velcdn.com/images/msung99/post/6f962028-1538-4e55-868d-ddeb63628de8/image.png)

---

## 트러블 슈팅 및 해결과정

#### 1.docker.sock 에 대한 권한을 설정안해주고, docker login 도 안해줬더니 발생한 에러

- 위에 제가적은 부제목 "Jenkins & Docker 그룹 추가" 의 내용을 똑같이 실행했더니, 문제가 해결되었습니다.

참고자료

[Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Post "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/auth": dial unix /var/run/docker.sock: connect: permission denied](https://technote.kr/369)

#### 2. Docker COPY failed: no source files were specified 에러

도커파일 안의 내용이 문제였습니다. 이전에 제가 프로젝트를 할때 /build/libs 에서 jar 파일과 같은 디렉토리 상에 도커파일이 위치하도록 하고, 그에 따른 도커파일 내용을 작성했었는데, 이 도커파일 내용을 그대로 이번 Jenkins 자동화 실험에서 그대로 인용하니 에러가 발생했습니다. 해결방법은 이번 포스팅의 도커파일과 같이 도커파일의 내용을 바꿔줬습니다.

[도커파일 작성 내용 참고](https://velog.io/@appti/%EB%8F%84%EC%BB%A4%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EC%8A%A4%ED%94%84%EB%A7%81-%EB%B6%80%ED%8A%B8)
[Docker COPY failed: no source files were specified 에러
](https://bgpark.tistory.com/132)

```
service docker start
systemctl start docker
```

---

## 마치며

지금까지 도커와 젠킨스를 활용해 CI/CD 를 구축하는 방법에 대해 알아봤습니다. 저도 타 블로깅을 참고하며 이렇게 구축을 하는데 성공했지만, 계속 에러가 발생하더라구요. 또 애매한 이론 및 명령어 설명으로인해 꽤 애먹었던 것 같네요. 그래서 많은 분들이 최대한 제 현재 포스팅을 보시고, 고생안하시고 도움이 되셨으면 하는 바람에서 나름 deep하게 적은것 같네요!

궁금한 내용이 있으시다면 댓글 꼭 넘겨주세요!! 제가 아는선에서 도와드리겠습니다 😉

---

## 참고

[[AWS] Jenkins를 활용한 Docker x SpringBoot CI/CD 구축
](https://velog.io/@haeny01/AWS-Jenkins%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-Docker-x-SpringBoot-CICD-%EA%B5%AC%EC%B6%95#-item-%EC%83%9D%EC%84%B1)[Docker/Jenkins 를 활용한 웹서버 자동 배포 & Image 자동 배포](https://junghwanta.tistory.com/45)
[[Docker & Jenkins] 도커와 젠킨스를 활용한 Spring Boot CI/CD🥸
](https://velog.io/@hind_sight/Docker-Jenkins-%EB%8F%84%EC%BB%A4%EC%99%80-%EC%A0%A0%ED%82%A8%EC%8A%A4%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-Spring-Boot-CICD#%EC%9E%91%EC%84%B1-%EB%8F%99%EA%B8%B0)
[Jenkins with Docker and GitHub
](https://velog.io/@dion/Jenkins-with-Docker-and-GitHub#jenkins%EC%99%80-github-%EC%97%B0%EB%8F%99%ED%95%98%EA%B8%B0)

[- 도커 설치 후 도커 명령어 실행 에러 Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?](https://league-cat.tistory.com/347)

- [Docker 데몬(Daemon)으로 수동 시작](https://help.iwinv.kr/manual/read.html?idx=583)
- [systemctl 실행문제 : privileged 권한으로 다시 이미지를 실행하기](https://hitomis.tistory.com/95)
- [jenkins 설치 내부에서 docker 실행](https://blog.opendocs.co.kr/?p=704)
- [su:Authentication failure](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=cthu3801&logNo=220710165047)

- [E212: Can't open file for writing 에러 해결 하기](https://iamrealizer.tistory.com/47)
- [Jenkins에서 sudo 권한 사용](https://hyunmin1906.tistory.com/282)
- [리눅스에서 sudo 권한이 없을때](https://starseeker711.tistory.com/176)
- [[Ubuntu] 리눅스에서 ... is not in the sudoers file. This incident will be reported. 문제 해결 방법](https://domdom.tistory.com/374)
- [useradd와 adduser의 차이](https://kit2013.tistory.com/187)

.
