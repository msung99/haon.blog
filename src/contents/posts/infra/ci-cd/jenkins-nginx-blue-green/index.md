---
title: Jenkins 와 Nginx 를 활용한 Blue/Green 배포 환경 구축하기
date: "2023-05-16"
tags:
  - Jenkins
  - CI/CD
  - Nginx
  - 블루그린
previewImage: infra.png
---

## Blue/Green 배포

[무중단 배포 아키텍처의 다양한 배포전략 (Rolling, Blue&Green, Canary 배포에 대해)](https://velog.io/@msung99/%EB%AC%B4%EC%A4%91%EB%8B%A8-%EB%B0%B0%ED%8F%AC-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EB%A5%BC-%EC%9C%84%ED%95%9C-%EB%B0%B0%ED%8F%AC%EC%A0%84%EB%9E%B5Rolling-BlueGreen-Canary-%EC%A0%84%EB%9E%B5) 에서도 말했듯이, 특정 서비스는 중단되지 않는 상태로 구버전에서 신버전을 사용자에게 계속해서 배포해야합니다. 그를 위해 서버를 최소 2대이상 확보해야 할것이며, Nginx 와 Apache 같은 `Reverse Proxy` 를 배치함으로써 상황에 따라 적절한 요청을 분산시킬 수 있어야합니다. 무엇보다 가장 중요한것은, **모든 클라이언트의 요청이 거절되는것 없이 적절히 처리되어야 할 것입니다.**

현업에서는 `AWS ELB`, `CodeDeploy` 와 같은 다양한 Blue/Green 배포를 지원받을 수 있으나, 이들의 도움을 받아서 배포환경을 구축하는 것은 매우 쉽지만, 인프라를 학습하는 입장에서는 뭔지도 모르고 쓰는것은 좋지 못할겁니다. 이번에는 Jenkins 와 Nginx 를 활용해서 저수준에서부터 시작해서 직접 Blue/Green 아키텍처를 구축해보겠습니다.

---

## Blue/Green 아키텍처 구성

![](https://velog.velcdn.com/images/msung99/post/10b582c3-8a54-4ddc-8835-e034d01d2c3c/image.png)

- 신버전이 깃허브에 PR 이 올라가고 main 브랜치게 병합되면, WebHook 을 통해 Build 가 유발되면서 jar 파일을 빌드하게 됩니다.

- Blue 서버의 프로세스를 Health Check 합니다. Blue 서버에서 프로세스가 죽어있다면 Blue 서버에다 신버전을 배포하고 Green 서버에서 실행되고 있는 기존의 구버전 프로세스를 kill 합니다. 반대로 Blue 서버의 프로세스가 실행중이라면 해당 프로세스를 kill 하고 Green 서버에다 신버전 프로세스를 실행시킵니다.

- 신버전 프로세스를 `nohup` 으로 실행시키고, 해당 프로세스가 정상적으로 실행되었는지 Health Check 합니다.

- 정상 실행되었다고 판단되면, 기존 구버전 프로세스에는 더 이상 트래픽을 보낼 필요가 없어지므로 Nginx 의 트래픽 분산 방향을 신버전 서버에다 분산시킵니다.

- 또 같은 이유로, 기존 구버전 프로세스는 더 이상 필요없는 것이므로 kill 합니다.

---

## 사전 셋팅

본격적인 아키텍처 구축에 앞서서, 사전에 셋팅해줘야할 작업물들이 있습니다. 우선 Blue 와 Green 서버에는 jdk 가 설치되어 있어야하며, 리버스 프록시 서버에 Nginx 를 설치해주어야 합니다.

### Jenkins 환경변수

또 추후 살펴보겠지만, 파이프라인 스크립트에서 리눅스 변수를 활용해야할 일이 있습니다. 이를 위해 Jenkins 의 환경변수 설정이 필요합니다. 위처럼 Dashboard > Jenkins 관리 > 시스템 설절 > Global properties 에서 각 인스턴스의 IP 주소값을 할당해줍시다.

![](https://velog.velcdn.com/images/msung99/post/879c268e-b979-4a94-b299-eaaf840b8451/image.png)

---

## SSH Agent 환경 구축

추후 살펴볼 스크립트를 보면 알겠지만, Jenkins 에서 빌드하고 생성한 jar 파일을 Blue 서버 (또는 Green 서버) 로 전송하기 위해 `scp` 를 활용합니다. 이를 위해선 Publish Over SSH 와 같은 기법이 있지만, 현재는 보안상의 이슈로 인해 잘 사용하지 않는 방법이라고 합니다. 저희는 scp 로 jar 파일 전송시 SSH Agent 를 활영할 것인데, 이를 위한 셋팅이 필요합니다.

### 1. SSH Agent 플러그인 설치

우선 `SSH Agent 플러그인` 설치가 필요합니다. 이 플러그인은 Jenkins 에서 초기에 제안된 기본 플러그인을 설치할때 함께 설치되는 항목이 아니라서, 별도의 설치가 필요합니다.
"DashBoard > Jenkins 관리 > 플러그인 관리" 로 접속해서 SSH Agent 를 검색하시고 직접 다운로드 받아줍시다.

### 2. SSH 인증서(RSA) 생성

다음으로는 Jenkins 서버에서 scp 로 전송시 SSH 인증방식을 활용하는데, 이를 위해 SSH 인증서를 생성해야합니다. SSH 인증서는 Jenkins 서버에서 아래와 같이 `ssh-keygen` 명령어로 RSA 포맷의 인증서를 생성할 수 있게됩니다.

```java
$ ssh-keygen -t rsa -b 4086

$ ssh-keygen -t rsa -b 4086
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa): /root/.ssh/id_rsa
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa
Your public key has been saved in /root/.ssh/id_rsa.pub
The key fingerprint is:
```

발급받게되면 공개키(id_rsa.pub) 와 비밀키(id_rsa) 가 생성되는데, 공개키의 값을 원격 서버(Blue 서버와 Green 서버) 에 복사를 해줘야합니다.

```java
$ ssh-copy-id -i /root/.ssh/id_rsa.pub root@111.111.111
```

위 명령어로 복사를 마쳤다면, SSH 접속이 잘 되는지 직접 확인해봅시다. 아래와 같은 명령어로 원격 접속이 가능한지 봅시다.

```java
$ ssh -i id_rsa root@111.111.111
```

이 과정을 문제없이 마쳤다면, 원격 서버(Blue 또는 Green 서버) 의 터미널로 접속해지게 됩니다. 만약 다시 Jenkins 서버의 터미널로 다시 되돌아오고 싶다면, `exit` 명령어로 되돌아옵시다.

### 3. Credentials : Jenkins에 ssh 인증 정보 등록

"Jenkins 관리 > Security > Credentials" 로 들어가서 앞서 발급받은 SSH 인증서를 Jenkins 에 등록해줍시다. 추후 파이프라인 구성시 SSH Agent 방식을 활용할때를 위해 등록해주는 겁니다.

![](https://velog.velcdn.com/images/msung99/post/bbafea36-1c25-4ca1-a69e-3652f86725c8/image.png)

이를위해 "Add Credentials" 를 눌러서 새로운 Credentials 을 등록해줍시다.

![](https://velog.velcdn.com/images/msung99/post/06e91161-a360-49e9-995a-f26279a86d16/image.png)

각 라인에 들어갈 정보는 다음과 같습니다.

- Kind : SSH Username with private key
- ID : 중복되지 않는 인증 ID - 해당 ID 값으로 pipline에서 인증 정보를 사용
- username : 생략
- private key : ssh-keygen 으로 생성한 SSH 키의 private key 값 내용 (ex: id_rsa) 으로 `$ cat id_rsa` 명령어로 출력되는 내용
- passphrase : ssh-keygen으로 인증키 생성시 입력한 password (ssh-keygen 명령어로 키를 생성할때 별도의 특별한 입력이 없었다면 그냥 공백으로 냅두시면 됩니다!)

---

## Nginx

위와같은 모든 과정을 마쳤다면, 이제부터 본격적인 아키텍처 구성을 시작할때입니다. 우선 Nginx 의 리버스리폭시 환경 구축을 진행해봅시다.

### sites-enabled

Nginx 를 설치하고 "/etc/nginx/sites-enabled" 로 접속해서 디폴트로 존재하는 파일인 default 를 제거하고, `vim myapp` 명령어로 myapp 이라는 Nginx 설정파일을 하나 만들어줍시다. 위에서 `include` 라는 명령어를 볼 수 있는데, 이는 외부에서 설정파일을 불러올 수 있는 Nginx 의 기능입니다. 또한 `$service_url` 이라는 URL 로 리버스 프록시 요청을 보내는 모습을 볼 수 있습니다. 이 service-url 이라는 변수에는 service-url.inc 이라는 파일로부터 값이 채워지게 됩니다.

```java
server {
    listen 80;

    include /etc/nginx/conf.d/service-url.inc;

    location / {
        proxy_pass $service_url;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
    }
}
```

### service-url.inc

```java
set $service_url http://111.111.111:8080;
```

일단 기본으로는 Blue 인스턴스의 IP로 설정해두었으나, Green으로 설정해도 상관없습니다. 젠킨스가 이 파일을 직접 수정하여 리버스 프록시 방향을 바꿔줄 것입니다.

---

## Jenkins 파이프라인 스크립트

이번 내용의 가장 핵심인 파이프라인 스크립트 전체 내용입니다. 우선 stage 를 크게 3단계로 구분지었습니다. 특정 깃허브 레포지토로부터 clone 받을 수 있는 `GiHub stage`, 클론받은 내용에 기반해 빌드를 실행후 jar 파일을 생성하는 `Build Stage`, 그리고 Blue/Green 배포가 수행되는 `Deployment Stage` 입니다. 이 중에서 Deployment stage 를 더 자세히 뜯어봅시다.

```java
pipeline {
    agent any
    stages {
        stage('Github') {
            steps {
                git branch: 'main', url: 'https://github.com/msung99/CI-CD-Jenkins-Project.git'
            }
        }
        stage('Build') {
            steps {
                sh "./gradlew bootJar"
            }
        }

        stage('Deployment') {
            steps {
                sshagent (credentials: ['key-jenkins']) {
                    sh '''#!/bin/bash
                        if curl -s "http://${blue_ip}:8080" > /dev/null
                        then
                            deployment_target_ip=$green_ip
                        else
                            deployment_target_ip=$blue_ip
                        fi

                        scp -o StrictHostKeyChecking=no ./build/libs/core-0.0.1-SNAPSHOT.jar root@${deployment_target_ip}:/home/ubuntu
                        ssh root@${deployment_target_ip} "nohup java -jar /home/ubuntu/core-0.0.1-SNAPSHOT.jar > /dev/null &" &


                        for retry_count in \$(seq 5)
                        do
                          if curl -s "http://${deployment_target_ip}:8080" > /dev/null
                          then
                              echo "✅ Health Checking 에 성공했습니다!"
                              break
                          fi

                          if [ $retry_count -eq 10 ]
                          then
                            echo "❌ Health checking 에 실패했습니다."
                            exit 1
                          fi

                          echo "🏥 10초후에 다시 Health Checking 이 시도될 예정입니다."
                          sleep 10
                        done

                        ssh root@${nginx_ip} "echo 'set \\\$service_url http://${deployment_target_ip}:8080;' > /etc/nginx/conf.d/service-url.inc && service nginx reload"
                        echo "Switch the reverse proxy direction of nginx to ${deployment_target_ip} 🔄"

                        if [ "${deployment_target_ip}" == "${blue_ip}" ]
                        then
                            ssh root@${green_ip} "fuser -s -k 8080/tcp"
                        else
                            ssh root@${blue_ip} "fuser -s -k 8080/tcp"
                        fi
                        echo " ✅ 구버전 프로세스를 종료하고, 신버전 프로세스로 교체합니다."
                    '''
                }
            }
        }
    }
}
```

### 1. SSH Agent

```java
sshagent (credentials: ['key-jenkins']) {
```

앞서 설명했듯이 scp 및 ssh 전송 방식이 이루어지게 되는데, 이를위해 사전에 등록해둔 SSH 인증서를 불러와야합니다. 이것이 없으면 바로 아래에서 살펴볼 과정속에서 `Permission Denied` 권한 오류가 발생하게 되니, 꼭 참고해주세요!

### 2. Blue 서버 Health Check

```java
if curl -s "http://${blue_ip}:8080" > /dev/null
then
   deployment_target_ip=$green_ip
else
   deployment_target_ip=$blue_ip
fi
```

Blue 서버에서 스프링부트 애플리케이션이 실행중인지 `curl` 명령어로 확인하게 했습니다. `-s` 옵션은 curl 이 실행중에 진행상황이나 오류 메시지등을 출력하지 않도록 하는 것으로, curl 의 출력을 최소화하여 화면에 표시되는 내용을 줄입니다.

또 리눅스의 `/dev/null` 디렉토리상에 출력 및 에러 메시지를 버리도록 설정했습니다. 이 디렉토리는 데이터를 기록하지 않고, 마치 블랙홀처럼 전달된 내용을 무시하도록 합니다. 즉, curl 의 불필요한 잡다한 출력내용들이 쌓아지않고 위 디렉토리에 전달되면서 자연스래 쓰레기통으로 버려지게 되는 셈입니다.

그리고 Blue 서버가 살아있다면 deployment_target_ip 에 `Green 서버의 IP` 를 할당하고, 반대로 죽어있다면 `Blue 서버의 IP` 를 할당합니다.

### 3. jar파일 전송 및 신버전 프로세스 실행

```java
scp -o StrictHostKeyChecking=no ./build/libs/core-0.0.1-SNAPSHOT.jar root@${deployment_target_ip}:/home/ubuntu
ssh root@${deployment_target_ip} "nohup java -jar /home/ubuntu/core-0.0.1-SNAPSHOT.jar > /dev/null &" &
```

다음으로 `scp` 명령어를 통해 앞서 빌드된 jar 파일을 Blue 또는 Green 서버에 전송합니다. 앞서 살펴본 if 조건문에 따라서, **만일 Blue 서버가 죽어있는경우 이 인스턴스에다 신버전을 배포하면 되므로, jar 파일은 Blue 에 전송될겁니다.**
그 뒤로 `nohup` 을 통해 jar 파일을 프로세스로써 실행시키는 모습을 볼 수 있습니다.

### 4. 10초 간격의 Health Check

```java
for retry_count in \$(seq 5)
do
  if curl -s "http://${deployment_target_ip}:8080" > /dev/null
  then
       echo "✅ Health Checking 에 성공했습니다!"
       break
  fi

  if [ $retry_count -eq 10 ]
  then
    echo "❌ Health checking 에 실패했습니다."
    exit 1
  fi

  echo "🏥 10초후에 다시 Health Checking 이 시도될 예정입니다."
  sleep 10
done
```

다음으로 신버전 프로세스가 정상적으로 실행되었는지 10초 주기의 간격을 두고 최대 5번을 헬스체킹합니다. 앞서 `nohup` 을 통해 프로세스가 문제없이 바로 실행되었다면, Health Checking 에 성공했다는 로그를 곧바로 출력받고 헬스체킹을 그만하게 될것입니다.

그런데 10초의 간격으로 최대 5번이나 헬스체킹을 시도했음에도 불구하고 신버전 프로세스가 정상 실행되지 않는다면, 빌드를 실패했다고 판단하고 파이프라인 스크립트 내용을 중단시키게됩니다.

### 5. Nginx 리버스 프록시 방향 변경

```java
ssh root@${nginx_ip} "echo 'set \\\$service_url http://${deployment_target_ip}:8080;' > /etc/nginx/conf.d/service-url.inc && service nginx reload"
echo "Switch the reverse proxy direction of nginx to ${deployment_target_ip} 🔄"
```

앞선 헬스체킹 과정을 통해 정상적으로 신버전 프로세스가 Green 서버 (또는 Blue 서버) 에 정상 배포되었다는 것이 안전하게 확인되었다면, Nginx 의 트래픽 분산 방향을 Blue 에서 Green 서버로 (또는 그 반대로) 바꾸게됩니다.

### 6. 구버전 프로세스 죽이기

```java
if [ "${deployment_target_ip}" == "${blue_ip}" ]
then
	 ssh root@${green_ip} "fuser -s -k 8080/tcp"
else
	ssh root@${blue_ip} "fuser -s -k 8080/tcp"
fi
echo " ✅ 구버전 프로세스를 종료하고, 신버전 프로세스로 교체합니다."
```

이제 신버전 프로세스가 정상 배포되고 리버스 프록시 서버도 정상적으로 트래픽 분산 방향이 바뀌게 되었으므로, 기존에 있던 Blue 서버의 (또는 Green 서버의) 구버전 프로세스를 Kill 하면 됩니다. 이때 `fuser` 를 사용하면 특정 포트를 점유하고 있는 프로세스를 종료할 수 있습니다.

---

## 실행결과

파이프라인을 직접 실행하면, 아래와 같은 결과를 확인할 수 있습니다. 기존에 실행되고 있던 Blue 서버의 구버전 프로세스를 Kill 하고 Green 서버에 신버전으로 교체하는 모습을 직접 확인해볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/c01bcfca-4039-4337-bce8-dd6b7eb47b62/image.png)

한번 더 실행해보면, 앞서 Green 서버에 배포되었던 프로세스를 Kill 하고 Blue 서버에 다시 신버전 프로세스를 배포하는 모습을 볼 수 있습니다. 이로써 Blue/Green 배포가 정상적으로 실행된 모습을 확인할 수 있습니다 😎

![](https://velog.velcdn.com/images/msung99/post/4a045fa6-bc3f-4d7c-80d0-70b3b4525187/image.png)

---

## 마치며

이렇게 직접 제 손으로 Blue/Green 배포를 구현해보니 정말 어려웠던 것 같습니다. 중간중간 머리를 쥐어짰던 기억이 정말 생생하네요! ELB, CodeDeploy 와 같은 고수준이며 추상된 기술에 의존하지않고 저수준에서 직접 구현해보니, 이게 진짜 로드밸런싱이자 무중단배포 아키텍처임을 스스로 깨달을 수 있는 좋은 경험이 된 것 같네요! 🙂

---

## 참고

- [Jenkins와 Nginx로 스프링부트 애플리케이션 무중단 배포하기](https://hudi.blog/zero-downtime-deployment-with-jenkins-and-nginx/)
- [Jenkins Documentation : Using credentials ](https://www.jenkins.io/doc/book/using/using-credentials/)
- [젠킨스 Credentials 등록](https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/)
- [젠킨스 파이프라인을 이용한 배포 자동화](https://sihyung92.oopy.io/e5300d92-1a4e-40f4-b927-a93b2bbb17d2)
- [[Jenkins] SSH 사용 - pipeline SSH Agent](https://royleej9.tistory.com/m/entry/Jenkins-SSH-%EC%82%AC%EC%9A%A9-pipeline-SSH-Agent)
- [[ssh] Permission denied (publickey). 접속 오류 해결하기](https://investechnews.com/ssh-permission-denied-publickey-%EC%A0%91%EC%86%8D-%EC%98%A4%EB%A5%98-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0/)
- [[linux] ec2 인스턴스 사용자의 ssh 보안 접속방법 두 가지 : 키페어, 비밀번호](https://zionh.tistory.com/14)
- [scp 사용하여 원격 서버에 배포하기](https://velog.io/@sileeee/scp%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-%EC%9B%90%EA%B2%A9-%EC%84%9C%EB%B2%84%EC%97%90-%EB%B0%B0%ED%8F%AC%ED%95%98%EA%B8%B0)
- [scp 명령어 리눅스 파일 전송](https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=eyeballss&logNo=220881562246)
- ChatGPT
