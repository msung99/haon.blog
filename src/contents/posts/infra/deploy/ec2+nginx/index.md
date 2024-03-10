---
title: AWS EC2, Nginx 를 활용하여 배포하기
date: "2023-01-03"
tags:
  - 배포
  - Nginx
---

## 시작에 앞서

localhost 로 돌리고 있던 본인의 스프링부트 프로젝트를 외부에 배포하고 싶을 때가 있습니다. 사이드 프로젝트를 진행하다보면 백엔드에서 개발한 API 서버를 클라이언트에게 넘겨줘야 할때 어떻게 배포를 시켜야할지 정말 막막할 수 있는데, 이번 포스팅에서는 AWS EC2, Nginx 를 활용해서 어떻게 무중단 배포가 이루어지는지 알아보겠습니다.

---

## 무중단 배포란?

간단히 말해서비스를 중지하지 않고, 배포를 계속하는 것을 무중단 배포라고 합니다. 이때 매번 배포를 할때마다 본인의 컴퓨터 터미널을 종료시키면 서버가 꺼져버릴 수 있는데, 서비스가 죽지 않고 배포가 가능하도록 무중단 배포를 구축해보는 법을 알아봅시다.

---

## 인스턴스 생성 + Elastic IP 할당

#### EC2 인스턴스 생성

인스턴스를 생성한 결과는 아래와 같습니다. 또한 저는 Ubuntu 18.04 환경을 기반으로 인스턴스를 구축했음을 미리 알려드립니다.

![](https://velog.velcdn.com/images/msung99/post/1a57ff37-6fa5-4dcf-84bc-650d1144215d/image.png)

또한 보안그룹 설정은 아래와 같이 HTTP, SSH, HTTPS 를 생성했습니다. 이때 주의해야 할점은 SSH 접속방식은 오로지 본인만 접속 가능하도록 "내 IP" 로만 설정해줘야합니다. 그렇지 않으면 해킹에 당할 위험이 있으니, 꼭 유의하시길 바랍니다!

![](https://velog.velcdn.com/images/msung99/post/b95a2dc2-83aa-478d-a3ec-094864403ea0/image.png)

#### Elastic IP 생성 및 인스턴스에 할당하기

인스턴스를 생성했다면 Elastic IP 를 할당해줘야 하는데, 아래와 같이 탄력적 IP 란에 들어가서 탄력적 IP 주소 할당을 클릭하여 하나 생성을 해줍니다.

![](https://velog.velcdn.com/images/msung99/post/9e3293c8-d008-477c-899e-d83488ac41e8/image.png)

그리고 생성한 탄력적 IP를 앞서 생성한 EC2 인스턴스에 연결해주면 됩니다. 탄력적 IP 주소 연결란에 들어가서 해당 탄력적 IP를 연결해줍시다.

![](https://velog.velcdn.com/images/msung99/post/a9e28829-f7ef-4ef5-9e52-0f99d309aa26/image.png)

---

## SSH를 통해 EC2에 접속

다음으로 SSH 접속을 통해 직전에 생성했던 EC2 인스턴스 서버에 접속할 수 있습니다. 터미널에서 인스턴스 생성시 만들었던 키페어를 넣어주고, 아래와 같은 형태로 접속하시면 EC2 서버에 접속이 성공할겁니다.

```
형태 : ssh -i "키페어 값" ubuntu@퍼블릭 IPv4 DNS"

=> 형태 예시 : ssh -i my-keypair ubuntu@ec2-5-256-91-790.compute-3.amazonaws.com
```

성공한다면 아래와 같이 접속되는 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/1a7cecb4-33ce-4fcb-a971-c715332be6a2/image.png)

---

## Nginx

이제 Nginx 를 가상서버에 설치할 차례입니다. 아래와 같이 Nginx 를 설치해줍시다.

```
sudo apt install nginx     // nginx 설치
sudo serivce nginx start   // 설치한 Nginx 가 정상적으로 반영되도록 재시작
ps -ef | grep nginx        // 정상적으로 Nginx가 실행되었는지 확인
```

![](https://velog.velcdn.com/images/msung99/post/c44989a4-c712-4b19-91fc-82f1b3f4390d/image.png)

---

## SpringBoot 프로젝트 서버에 git clone 받기

#### html 파일 삭제

앞서 Nginx 가 정상적으로 설치 및 실행되고 있다면 /var/www/html 파일이 우분투 서버에 존재하게 됩니다. 이 html 파일을 삭제해줍시다. 만일 해당 디렉토리 및 파일이 존재하지 않는다는 결과를 받게된다면, Nginx 정상 설치 여부를 다시 확인해보시길 바랍니다.

```
cd /var/www    // var/www 디렉토리로 이동
ls             // 해당 디렉토리에 html 파일이 존재하는지 여부 확인
rm -rf html    // 존재한다면 해당 파일을 삭제하기
ls             // html 파일이 삭제되었는지 확인
```

![](https://velog.velcdn.com/images/msung99/post/e6dadce8-f0e4-4ae2-a389-22e7303fc563/image.png)

#### SpringBoot 프로젝트 git clone 받기

- 이제 SpringBoot 프로젝트를 진행한 내용을 EC2 서버에 내려받고, build 를 실행하고 서버를 키는 과정을 진행해야합니다. 배포 시스템 이런거 모두 생략하고, 여러 방법중 git clone 을 받는 방법을 알아보겠습니다.

![](https://velog.velcdn.com/images/msung99/post/c34ac9e4-cd96-4e13-b24b-49945a8c7b06/image.png)

위처럼 본인의 레포지토리로 이동합시다. 그러고 Code 버튼을 클릭하여 해당 레포지토리의 URL 를 카피해줍시다.

그리고 다시 터미널로 돌아가, git clone 을 받아주시면 됩니다. 쉽게말해, 가상의 서버에다 본인의 프로젝트 내용을 클론받아서 build 를 해주고 이 서버에서 SpringBoot 를 실행시키기 위한 과정입니다.

![](https://velog.velcdn.com/images/msung99/post/d0f557c9-1d38-4f87-b3fe-d6ed589b0323/image.png)

```
git clone "레포지토리 주소"
```

---

## JAVA 설치

현재 EC2 서버에는 자바가 설치되어 있지 않을겁니다. 자바 설치 여부를 확인해봅시다.

```
java --version
```

만일 설치되어 있지 않다면 아래와 같이 자바를 서버에 설치해줍시다.

```
apt install default-jdk -y
```

그러고 다시 자바 버전을 확인하여 자바가 정상적으로 설치되었는지 확인해봅시다!

![](https://velog.velcdn.com/images/msung99/post/dc35345f-8577-42e1-94ff-e945b2e1799b/image.png)

---

## Nginx에서 가상서버 환경 설정하기

다음으로 Nginx 에 관한 추가적인 설정이 필요합니다. sites-available 이란 디렉토리로 이동하여 vim 편집기를 통해 추가적인 설정을 진행해줘야 합니다.

- sites-available: 가상 서버 환경들에 대한 설정 파일들이 위치하는 부분입니다. 가상 서버를 사용하거나 사용하지 않던간에 그에 대한 설정 파일들이 위치하는 곳입니다.

```
vim /etc/nginx/sites-available/default
```

정상적으로 이동했다면 아래와 같은 vim 편집 화면이 나오게 될 겁니다.

![](https://velog.velcdn.com/images/msung99/post/d7e38b39-cfad-4d8b-a420-a5e8020ac56b/image.png)

아래로 내려시다보면 아래와 같이 Nginx 관련 설정을 그대로 진행해주시면 ㄷ굅니다. 이때 유의해야 할 점은 저는 따로 스프링부트 프로젝트를 9001번 포트로 localhost 에서 실행되도록 열어두었는데, 별도로 지정해두지 않으셨다면 proxy_pass 부분을 8080 포트로 진행해주시면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/56fc0af8-3f7f-4102-8e17-ddcc41e3a627/image.png)

이제 Nginx에 문법이 제대로 되어있는지 확인하고 재시작을 해주면됩니다.

```
systemctl restart nginx
```

---

## SpringBoot 빌드 테스트하기

이제 앞서 클론받은 프로젝트를 빌드하고 실행시켜주면 끝입니다.
다시 "/var/www/해당프로젝트" 로 이동하여, 빌드가 정상적으로 수행되는지 테스트를 한번 돌려봅시다.

![](https://velog.velcdn.com/images/msung99/post/20b5bdea-f0db-499d-8476-083e21c0ac4f/image.png)

```
./gradlew clean build
```

위와 같이 BUILD SUCCESSFUL 이 뜬다면 빌드 테스트에 성공한 것입니다.

---

## SpringBoot 실행하기

거의 마지막까지 왔습니다. 이제 스프링부트 프로젝트의 스냅샵을 가지고 실행시켜주면 됩니다.

![](https://velog.velcdn.com/images/msung99/post/6c116499-9d9e-402a-b6f5-84918a8635c3/image.png)

```
cd /build/libs
java -jar core-0.0.1-SNAPSHOT-plain.jar
```

아래와 같이 뜨면 서버가 정상적으로 실행된 것 입니다!

![](https://velog.velcdn.com/images/msung99/post/7ff77364-7cc9-4e6d-b7a3-b3041de7db8f/image.png)

---

## 무중단 배포

그런데 사실 위와 같이 배포한다면, 본인의 터미널 창을 꺼버린다면 서버도 함께 종료가 됩니다. 따라서 말그래로 서버가중단되는 일 없이 "무중단 배포" 가 되도록 아래와 같이 nohup 을 통해 무중단 배포를 해줄 수 있습니다. nohup으로 실행해주면 프로세스를 죽이지 않는한 컴퓨터를 끄거나 터미널을 닫거나 해도 꺼지지 않습니다.

```
nohup java -jar 자신의 프로젝트.jar &
```

참고로 아래와 같은 추가 명령어도 참고하시면 좋겠습니다.

```
$ ps -ef     // 서버를 종료
```

```
$ kill -9 {pid번호}
```

커맨드를 통하여 프로세스를 조회한 후 백그라운드에서 돌아가고 있는 jar파일의 pid 번호를 확인하고 $ kill -9 {pid번호} 로 종료할 수 있습니다.

---

## 결과 확인

![](https://velog.velcdn.com/images/msung99/post/4ea76d3c-a4cc-48e2-a591-44058726e7da/image.png)

배포한 IP 주소로 접속했을 떄 위와 같은 화면이 보인다면 성공한겁니다!

---

## 마치며

지금까지 스프링부트를 Nginx 를 활용하여 EC2 서버에서 무중단 배포를 하는 방법에 대해 알아보았습니다. 사실 이 방법외에도 서버 구축 및 배포 방법은 개발자가 원하는 방법으로 하기 나름이라 정말 다양한 접근방식으로 배포가 가능할 겁니다. 그 중 제가 배포했던 방식을 설명드렸던 것이며, 배포에 대해 잘 모르셨던 분들에게 도움이 되셨으면 합니다.

---

## 참고

- https://dev-jwblog.tistory.com/42#1.%20%EB%AC%B4%EC%A4%91%EB%8B%A8%20%EB%B0%B0%ED%8F%AC%C2%A0
- https://velog.io/@hwsa1004/SpringBootAWSRDS-%EC%84%9C%EB%B2%84-%EB%AC%B4%EC%A4%91%EB%8B%A8-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0-EC2%ED%8E%B8-
- https://rypro.tistory.com/218#recentComments
- https://realsalmon.tistory.com/3
- https://suyeoniii.tistory.com/52
- https://velog.io/@bbodela/AWS-EC2
