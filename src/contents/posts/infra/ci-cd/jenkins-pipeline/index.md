---
title: Jenkins 의 파이프라인 기반 배포 자동화 환경 구축 구축하기
date: "2023-05-16"
tags:
  - Jenkins
  - CI/CD
---

## 학습배경

지난 [[CI/CD] Jenkins 기반 다중 Docker 컨테이너 : 애플리케이션 동시 배포 자동화하기](https://velog.io/@msung99/CICD-Jenkins-%EA%B8%B0%EB%B0%98-%EB%8B%A4%EC%A4%91-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-%EC%95%A0%ED%94%8C%EB%A6%AC%EC%BC%80%EC%9D%B4%EC%85%98-%EB%B0%B0%ED%8F%AC-%EC%9E%90%EB%8F%99%ED%99%94) 에서는 FreeStyle Project 에 기반한 젠킨스 기반 CI/CD 자동화 환경을 구축했었습니다. 하지만 더 복잡한 자동화 아키텍처 환경이 요구되는 상황에서는 분명 이 방법은 한계에 부딪힐 것이기에, 더욱이 깊이있는 학습을 진행하고자 이렇게 파이프라인에 기반해서 자동화 환경을 구축하는 방법에 대해 학습을 진행하고자 합니다.

> 지난 포스팅을 어느정도 학습했다는 가정하로 진행되니, 이점 참고바랍니다!

---

## 아키텍처 구성

![](https://velog.velcdn.com/images/msung99/post/606d2cce-06e2-46b9-b9c6-3cd8332f4c1d/image.png)

자동화 환경 아키텍처 구성은 복잡하지 않습니다. 이번 학습의 주목적은 `파이프라인`의 개념과 `리눅스 쉘 스크립트` 에 기반해서 애플리케이션을 구버전에서 신버전으로 어떻게 교체하는지를 중점으로 다루는데에 있습니다. 같은 이유로 Blue/Green 과 같은 무중단배포 전략은 이번 주제에서 벗어나는 내용이므로 제외했습니다. 복잡한 내용들은 추후에 다루어보고자 합니다.

---

## 인프라 환경 구축

자동화 환경을 위한 셋팅은 [[CI/CD] Jenkins 를 이용한 Docker 컨테이너 기반 스프링부트 애플리케이션 배포 자동화](https://velog.io/@msung99/CICD-Jenkins-Docker-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-SpringBoot-%EB%B0%B0%ED%8F%AC-%EC%9E%90%EB%8F%99%ED%99%94-%EA%B5%AC%EC%B6%95) 에서 다룬것과 거의 동일합니다. 거의 동일한 상황에서 차이점만을 언급해보자면 다음과 같습니다.

### jar 파일 기반 애플리케이션 실행

우선 지난번에는 배포 서버(스프링부트 애플리케이션 서버) 가 도커 컨테이너에 기반해서 애플리케이션 프로세스가 운영되는 환경이였습니다. 반대로 이번에는 컨테이너를 사용하지 않고, jar 파일에 기반하여 애플리케이션을 실행하도록 했으며, 이에따라 스프링부트 서버에 별도의 jdk 설치가 필요합니다.

```java
// 배포 서버 (스프링부트 서버) 에 사전 셋팅해줘야할 사항
$ java --version
$ apt install default-jdk -y  // jdk-11 에 기반한다.
```

### 파이프라인 VS FreeStyle Project

앞서 언급했던 내용이겠디만, 이번에는 파이프라인에 기반해서 자동화 환경을 구축했습니다. 또 리눅스 쉘 스크립트를 하나 생성하고, 해당 파일을 읽어와서 배포를 자동화하는 환경을 구축했습니다.

```java
// 1. Docker 설치
$ sudo apt update
$ sudo apt install apt-transport-https ca-certificates curl software-properties-common
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
$ sudo add-apt-repository "deb [arch=amd64] $ https://download.docker.com/linux/ubuntu bionic stable"
$ sudo apt update
$ apt-cache policy docker-ce
$ sudo apt install docker-ce

// 2. Jenkins Image Pull + Run
$ docker pull jenkins/jenkins:lts
$ docker run --privileged -d -p 8080:8080 -p 50000:50000 --name jenkins jenkins/jenkins:lts
```

### EC2 vs Linode 인스턴스

EC2 에 기반해서 인스턴스를 구축하면 좋겠으나, 아쉽게도 저는 어딘가에서 지원금이나 크래딧을 받고 학습을 진행하는게 아닙니다. 운좋게도 주변 지인에게 Linode 크래딧을 제공받은게 있어서, 이번 인스턴스는 Linode 클라우드로부터 Ubuntu 22.04 LTS 버전의 환경을 구축하게 되었습니다.

---

## Publish Over SSH

젠킨스 설치를 완료했다면, 파이프라인 구성을 다루기전에 먼저 SSH 연동을 다루고자 합니다. 조금 당황스러울 수 있겠지만, 제 기준에선 SSH 연동이 잘 안되서 애먹었던 기억이 생생하기 때문이에요. [[CI/CD] Jenkins 를 이용한 Docker 컨테이너 기반 스프링부트 애플리케이션 배포 자동화](https://velog.io/@msung99/CICD-Jenkins-Docker-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-SpringBoot-%EB%B0%B0%ED%8F%AC-%EC%9E%90%EB%8F%99%ED%99%94-%EA%B5%AC%EC%B6%95#dockerfile-%EC%9E%91%EC%84%B1) 에서 다루었던 내용처럼 플러그인을 설치해주고, Jenkins 관리 > 시스템 설정 > Publish over SSH 로 접속해줍시다.

![](https://velog.velcdn.com/images/msung99/post/18f4b7cf-112d-492e-8049-83c867705532/image.png)

일반적으로 사용하는 EC2 인스턴스라면 위에서 Key 란에다 본인이 EC2 인스턴스에 접속할때 필요한 pem 파일의 값을 `cat` 명령어로 출력해서 복붙하는 과정이 필요합니다. 하지만 저는 앞서 말했듯이 EC2 환경이 아니기때문에, Passphrase 란에다 서버 접속시 필요한 root 계정의 비밀번호를 입력해주었습니다.

![](https://velog.velcdn.com/images/msung99/post/d7b62cff-93c1-4a06-97b6-38c9e92ff757/image.png)

또 그 아래에는 ssh server 를 추가해야합니다. 각 란을 설명해보자면 다음과 같습니다.

- Name : 임의의 서버이름
- Hostname : 스프링부트 배포 서버 IP 주소. 즉 빌드된 파일을 전송할 서버의 IP 를 기입해주시면 됩니다.
- Username : root 계정 이름. Linode 의 경우 본인이 설정한 루트계정의 이름을 입력해주시면 되고, EC2 의 경우는 별도의 설정이 없었다면 기본값은 ubuntu 입니다.
- Remote Directory : 빌드된 jar 파일이 도착할 베이스 디렉토리를 적어주시면 됩니다.

다 잘 추가했다면 Test Configuration 버튼을 눌러 확인해줍니다!

---

## 파이프라인 구성

![](https://velog.velcdn.com/images/msung99/post/01161b63-4796-48e5-b019-d05cebfecec9/image.png)

이제부터 본격적인 파이프라인 구성을 시작해봅시다. New Item 을 클릭하여 Pipeline 을 하나 생성해줍시다.

![](https://velog.velcdn.com/images/msung99/post/306e8c29-ef05-45a3-b380-2be8e42a0031/image.png)

새로운 파이프라인이 생성되었다면, 깃허브로 부터 빌드를 유발받을 수 있도록 "GiHub hook trigger for GITScm polling" 을 체크해줍시다.

---

## 파이프라인 구성단위 개념

당연한 말이지만, 파이프라인 구성을 진행하기 위해선 파이프라인의 각 단위에 대해 개념을 이해하고 작성해야합니다. 그를 위한 설명을 간단히나마 해보자면 다음과 같습니다.

```java
pipeline {
    agent any

    stages {
        stage('git') {
            steps {
                echo 'Hello World'
            }
        }
    }
}

```

### Pipeline Syntax

파이프라인의 구성단위는 아니지만, 저희가 스크립트 작성이 맨처음에 막막하다면 저희는 젠킨스에서 지원해주는 pipeline syntax 라는 기능을 사용할 수 있습니다. 이는 추후 계속 설명할 내용이지만 파이프라인의 각 `stage` 에 들어갈 구성물들을 쉽게 스크립트로 자동 구성해줍니다.

### stages & steps

stage 는 말그대로 번역하면 "단계" 입니다. stage 는 각각의 Job 실행단위를 의미하며, Job 여러개를 통칭해서 stages 라고 부르는것이죠. 그리고 각 stages 단위 안에는 steps 가 들어있습니다. 각 stages 는 Job 내부의 단계를 의미하는 steps를 포함해야합니다. steps에선 실제로 실행할 쉘이나 syntax를 입력해주면 됩니다.

### agent

agent 는 해당 파이프라인 스크립트를 실행할 executor 를 지정합니다. any 로 지정할경우, 어떤 executor 도 실행할 수 있다는 의미가 됩니다.

---

## Github Clone Stage

![](https://velog.velcdn.com/images/msung99/post/6722628a-c987-488f-881d-c48ad352b437/image.png)

그리고 지금부터 대망의 파이프라인 구성을 시작해봅시다. 추후 계속 등장하겠지만, 파이프라인 구성이 수동으로 작성하는게 많이 힘들다면 "Pipeline Syntax" 를 클릭해서 편하게 스크립트를 작성할 수 있도록 도움을 받을 수 있으니 이점 참고해서 구성해봅시다.

![](https://velog.velcdn.com/images/msung99/post/5544ac78-1aa0-4ec5-872d-e9811d56b229/image.png)

Pipeline Syntax 을 들어가서 스크립트 작성을 위한 소스를 마련해봅시다. 지난 포스팅을 참고하셨다면 어떤 내용들인지 충분히 이해할 수 있을거라는 생각이 듭니다. 이때 Credentials 란에서 새롭게 Credentials 을 하나 add 해주어야 하는데, 저는 이번에 아래처럼 Username with password 로 진행하겠습니다.

![](https://velog.velcdn.com/images/msung99/post/7dc56b80-dc77-4d90-9625-5967c3c5f73c/image.png)

Username 에는 본인의 깃허브 아이디, Password 에는 Personal Access Token 을 하나 발급받고 이곳에 기입해줍시다. 몰론 그냥 평소에 쓰던 깃허브 비밀번호도 좋지만, 보다 보안성을 높이고자 엑세스 토큰을 활용하는게 좋다는 생각입니다.

![](https://velog.velcdn.com/images/msung99/post/f30ec3be-4f3d-4e31-8bdd-66e3bce0afab/image.png)

이렇게 다 마치고 Generate Pipeline Script 를 클릭하면 위 조건들로 구성한 스크립트 내용이 결과물로 도출됩니다. 이를 기반으로 1차적인 파이프라인 뼈대를 구성해보자면 아래와 같은 결과물이 나오게됩니다. 참고로 credentialsId 란을 보면 별도의 별칭을 부여해준 것을 볼 수 있는데, 이는 위에서 Add Credentials 를 할때 별칭을 부여가능한 것이니 참고 바랍니다.

```java
 pipeline {
        agent any

        stages {
            stage('github clone') {
                steps{
             		git branch: 'main',
                        credentialsId: 'repo-and-hook-access-token-credentials',
                        url: 'https://github.com/msung99/CI-CD-Jenkins-Project.git'
                }
            }
	}
}
```

---

## Build Stage

다음으로 빌드 stage 를 구성해봅시다. 큰 고민없이, 아래와 같은 build stage 를 만들 수 있을겁니다.

```java
    pipeline {
        agent any

        stages {
            stage('github clone') {
                steps {
                    git branch: 'main',
                        credentialsId: 'repo-and-hook-access-token-credentials',
                        url: 'https://github.com/msung99/CI-CD-Jenkins-Project.git'
                }
            }

            stage('build'){
                steps{
                     sh'''
                        echo build start
                        ./gradlew clean bootJar
                     '''
                }
            }
        }
    }
```

하지만 여기서 "지금 빌드" 버튼을 클릭해서 빌드를 시도했을때 실패하는 경우가 있을 수 있는데, 이는 서브모듈이 존재할때 실패하게됩니다. git plugin snippet은 서브모듈의 init과 update까지 지원해주진 않습니다. 이렇게 생성한 syntax가 원하는대로 동작하지 않으면 다른 step을 찾거나, 공식문서를 통해 원하는 설정이 있는지 확인해봐야 합니다.

```java
 pipeline {
        agent any

        stages {
            stage('github clone') {
                steps{
                    checkout(
                        [$class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions:
                        [[$class: 'SubmoduleOption',
                            disableSubmodules: false,
                            parentCredentials: true,
                            recursiveSubmodules: false,
                            reference: '',
                            trackingSubmodules: true]],
                        userRemoteConfigs:
                            [[credentialsId: 'repo-and-hook-access-token-credentials',
                                url: 'https://github.com/msung99/CI-CD-Jenkins-Project.git']]
                        ]
                    )
                }
            }

            stage('build'){
                steps{
                        sh'''
                            echo build start
                            ./gradlew clean bootJar
                        '''
                }
            }
        }
    }
```

서브모듈을 고려한 스크립트는 위와 같습니다. 서브모듈이 private인 경우 서브모듈 레포지토리 이름과 메인 프로젝트에서 서브모듈을 포함한 디렉토리 명이 일치하지 않으면 레포지토리를 못 찾는 버그가 있었습니다. 디렉토리명을 수정하여 해결했습니다.

---

## publish on ssh stage

다음으로 publish on ssh stage 를 작성해봅시다. 이를위해서 다시 pipeline syntax 를 활용할겁니다.

![](https://velog.velcdn.com/images/msung99/post/fb1aeb9f-52a5-40de-a6aa-5120dfdca9e4/image.png)

각 라인에 대한 설명을 해보자면 다음과 같습니다.

- source files : 소스파일 (jar 파일) 의 위치입니다. gradle wrapper 를 통해 빌드한 결과물은 build/libs 에 위치하게 되므로, build/libs/\*.jar 로 작성했습니다.

- remove prefix : 말그대로 prefix (접두사) 를 제거하는 것입니다. 소스파일(jar 파일)에서 원본파일의 디렉토리를 어디까지 포함할 것인지에 대한 설정입니다. 필요하지 않으므로 디렉토리를 모두 제거합니다. 위와 같이 적은 경우, 만약 /build/libs/core-0.0.1.SNAPSHOT.jar 에 jar 파일이 존재한다면 "/build/libs" 라는 접두사가 제거되고 "core-0.0.1.SNAPSHOT.jar" 라는 것만 접두사 제거 결과물로 도출되는 것입니다.

- Remote directory : 앞서 초반에 빌드된 jar 파일이 도착할 베이스 디렉토리를 적어주었을텐데, 이 베이스 디렉토리에 이어서 배포될 상세 경로를 추가적으로 적어주는 것입니다.

  가령 위와 같이 적었을때, 베이스 리렉토리는 "/home/ubuntu" 이고 추가적으로 지금 적어준 세부 디렉토리는 "/myproject/deploy" 이므로, jar 파일이 배포될(위치하게될) 정확한 디렉토리는 "/home/ubuntu/myproject/deploy" 가 되는 것입니다.

당연한 말이지만, 인스턴스에서 /myproject/deploy 라는 디렉토리는 기본적으로 에당초 존재하지 않을겁니다. 따라서 `mkdir` 명령어를 통해 디렉토리를 새롭게 생성해주고, 이 안에 jar 파일이 유입될 수 있게 해줍시다. 또 EC2 를 사용하는 경우 기본적으로 "/home/ubuntu" 디렉토리는 기본적으로 존재해서 문제가 없지만, 저처럼 Linode 를 사용하는 경우 이 디렉토리는 존재하지 않으므로 이 디렉토리도 감안해서 생성해줘야합니다. 즉, "/home/ubuntu/myprojct/deploy" 라는 디렉토리가 생성되어 합니다.

- exec command : 전송을 마치고 실행할 shell문의 디렉토리 및 파일 위치입니다. 바로 아래에서 보겠지만, 저희가 직접 작성한 "init_server.sh" 라는 쉘 스크립트 파일에 기반해서 배포가 실행되는 것입니다.

---

## 파이프라인 최종 스크립트

위 과정들을 잘 따라했다면, 아래와 같은 최종적인 파이프라인이 완성됩니다. 참고로 sshPublisher 필드의 경우 verbose옵션이 있는데, 해당 옵션을 true 로 값을 부여하면 트러플 슈팅시 유용합니다. 빌드의 console output에 해당 내용이 상세하게 찍힙니다.

```java
 pipeline {
        agent any

        stages {
            stage('github clone') {
                steps{
                    checkout(
                        [$class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions:
                        [[$class: 'SubmoduleOption',
                            disableSubmodules: false,
                            parentCredentials: true,
                            recursiveSubmodules: false,
                            reference: '',
                            trackingSubmodules: true]],
                        userRemoteConfigs:
                            [[credentialsId: 'repo-and-hook-access-token-credentials',
                                url: 'https://github.com/msung99/CI-CD-Jenkins-Project.git']]
                        ]
                    )
                }
            }

            stage('build'){
                steps{
                        sh'''
                            echo build start
                            ./gradlew clean bootJar
                        '''
                }
            }

            stage('publish on ssh'){
                steps{
                        sshPublisher(
                            publishers:
                                [
                                    sshPublisherDesc(
                                        configName: 'msung99',
                                        transfers:
                                            [
                                                sshTransfer(
                                                    cleanRemote: false,
                                                    excludes: '',
                                                    execCommand: 'sh /home/ubuntu/myproject/deploy/init_server.sh',
                                                    execTimeout: 120000,
                                                    flatten: false,
                                                    makeEmptyDirs: false,
                                                    noDefaultExcludes: false,
                                                    patternSeparator: '[, ]+',
                                                    remoteDirectory: '/myproject/deploy',
                                                    remoteDirectorySDF: false,
                                                    removePrefix: 'build/libs',
                                                    sourceFiles: 'build/libs/*.jar')],
                                                    usePromotionTimestamp: false,
                                                    useWorkspaceInPromotion: false,
                                                    verbose: true
                                                )
                                            ]
                                        )
                }
            }
        }
    }
```

---

## 리눅스 쉘 스크립트 작성

앞서 계속 언급했던 쉘 스크립트 파일을 작성해봅시다. 그 내용은 아래와 같이 작성해줬습니다.

```java
#! bin/bash

CURRENT_PID=$(pgrep -f core-0.0.1.SNAPSHOT.jar | head -n 1)

if [ -z "$CURRENT_PID" ]; then
        echo "구동중인 애플리케이션이 없으므로 종료하지 않습니다."
else
        echo "구동중인 애플리케이션을 종료했습니다. (pid: $CURRENT_PID)"
        kill -15 $CURRENT_PID
fi

sudo -E nohup java -jar /home/ubuntu/myproject/deploy/core-0.0.1-SNAPSHOT.jar &
```

우선 CURRENT_PID 변수에 현재 실행중인 스프링부트 애플리케이션 프로세스의 PID 값을 얻어오게 됩니다. 만약 PID 값이 0 이라면 현재 실행중인 프로세스가 없다는 것이므로 별도의 처리없이 바로 nohup 명령어를 통해 jar 파일을 실행하는 것입니다.

반대로 PID 값이 0이 아니라면 현재 이미 실행되고 있는 스프링부트 애플리케이션 프로세스가 존재한다는 것이므로, 헤당 구버전 프로세스를 종료시키고, 현재 새롭게 유입된 jar 파일에 기반하여 신버전으로 새롭게 프로세스를 실행시킵니다.

### jar 파일 경로

![](https://velog.velcdn.com/images/msung99/post/c1a4429c-5a8d-40de-8b88-ec3cb14e0acc/image.png)

지금껏 문제없이 따라왔다면 jar 파일은 /home/ubuntu/myprojecyt/deploy 에 위치하게 될것입니다. 또한 init_server.sh 쉘 스크립트 파일도 이 경로에 생성했으니, 이 경로에 위치해있는 모습을 볼 수 있습니다.

---

## 실행결과

Console Output 을 조회해보면, 정상적으로 실행한 경우 아래와 같은 결과를 조회할 수 있게 됩니다!

![](https://velog.velcdn.com/images/msung99/post/0b46f5d1-d416-4281-98e1-9f0eaf563341/image.png)

또 기존에 실행중인 프로세스를 종료하고 구버전 -> 신버전으로 교체되는 case 는 아래와 같은 결과를 조회할 수 있게됩니다.

![](https://velog.velcdn.com/images/msung99/post/52b414e6-ac34-4b49-9f61-58e0a764ff02/image.png)

---

## WebHook

추가적으로 Jenkins 내부에서 직접 "지금 빌드" 버튼을 클릭해서 배포를 자동화하는 것이 아니라, main 브랜치에 PR 내용이 병합된 경우 배포가 자동화되게 하려면 WebHook 연동이 필요할겁니다. 이 내용은 [[CI/CD] Jenkins 를 이용한 Docker 컨테이너 기반 스프링부트 애플리케이션 배포 자동화](https://velog.io/@msung99/CICD-Jenkins-Docker-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-SpringBoot-%EB%B0%B0%ED%8F%AC-%EC%9E%90%EB%8F%99%ED%99%94-%EA%B5%AC%EC%B6%95#dockerfile-%EC%9E%91%EC%84%B1) 에서도 자세히 다룬 내용이므로, 이 내용은 생략하겠습니다.

---

## 마치며

FreeStyle Project 로만 CI/CD 자동화 환경을 구축하다가 직접 파이프라인을 구축해보니 정말 어려웠던 것 같습니다. 다음번에는 Nginx 를 활용해서 Blue/Green 을 직접 구축해보는 경험을 진행해봐야겠다는 아이디어가 떠오르네요! 긴글 읽어주셔서 감사합니다 😁

---

## 참고

- [젠킨스 파이프라인을 이용한 배포 자동화](https://sihyung92.oopy.io/e5300d92-1a4e-40f4-b927-a93b2bbb17d2)
- [젠킨스를 사용한 달록팀의 지속적 배포 환경 구축기 (1) - 백엔드편](https://dallog.github.io/continuous-deploy-with-jenkins-1-backend/)
- [🏗️ Jenkins를 이용한 SSH 통신을 통해 AWS EC2 서버 배포 파이프라인 구성하기](https://leehosu.github.io/jenkins_ssh)
- [젠킨스 서버 SSH Key 생성 & 등록](https://parkhyeokjin.github.io/devops/2020/10/14/JekinsSshConfigure.html)
