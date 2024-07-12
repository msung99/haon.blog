---
title: 쿠버네티스(Kubernetes) 단일 환경에서 애플리케이션 배포 및 수평확장(Scale Out) 하기
date: "2023-03-24"
tags:
  - 쿠버네티스
previewImage: book.png
---

## 시작에 앞서

쿠버네티스 위에서 애플리케이션을 실행할 수 있는 방법은 다양합니다. 보통 배포하고자 하는 구성요소를 기술한 JSON 이나 YAML 매니페스트를 구성해야하지만, 간단한 명령어 한 줄로 애플리케이션을 실행해봅시다. 또 그 과정에서 파드(Pods), 서비스 오브젝트, 레플리카의 유지적인 메커니즘에 대해 알아봅시다.

---

## 애플리케이션 구동 환경

[[Kubernetes] Minikube 를 활용한 단일 노드 쿠버네티스 클러스터 환경 구축](https://velog.io/@msung99/Kubernetes-Minikube-%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-%EB%8B%A8%EC%9D%BC-%EB%85%B8%EB%93%9C-%EC%BF%A0%EB%B2%84%EB%84%A4%ED%8B%B0%EC%8A%A4-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0-%EA%B5%AC%EC%B6%95) 에서도 봤듯이, 쿠버네티스 실습을 위한 단일 클러스터 환경을 구축하고 싶다면 Minikube 를 활용하는 것이 적절합니다. Minikube 에 기반하여 클러스터를 구축할 것이며, 파드수를 늘리거나 인스턴스를 자동으로 늘리는 환경을 구성하늗 등 다양한 메커니즘을 알아보겠습니다.

### 이미지 실행

애플리케이션을 실행하는 가장 간단한 방법은 kubectl run 명령어를 사용해서, JSON 이나 YAML 을 사용하지 않고 필요한 모든 구성요소를 생성하는 방법입니다.

```java
kubectl create deployment kubia --image=msung99/maestro:0.1.0
// kubectl run kubia --image=msung99/maestro:0.1.0 --port=8080
```

쿠버네티스에서 클러스터의 한 단위인 파드(Pods) 라는것을 생성 및 관리하는 컨트롤러가 존재합니다. 그 컨트롤러에는 크게 `replication controller` 와 `deloyment controller` 가 존재하죠. 저희는 이 중에 depolyment 를 기반으로 클러스터를 구성할 것입니다. 참고로 이때 레플리케이션 컨트롤러는 deprecated 되었고, 추후에 사라질 예정이라고합니다.

예전에는 `--genertaor` 옵션을 통해 레플리케이션 컨트롤러를 생성했지만, 말했듯이 deprecated 되었기 때문에 현재는 사용 불가합니다.

```java
// --generator 사용 불가
kubectl create deployment kubia --image=msung99/maestro:0.1.0 --generator=run/v1
```

---

## 파드(Pod)

![](https://velog.velcdn.com/images/msung99/post/e78f1598-5268-469f-9032-cbf3dad54744/image.png)

쿠버네티스에서는 개별 컨테이너를 직접적으로 일일이 다루지 않습니다. 대신 **함께 배치된 다수의 컨테이너라는 개념**을 사용하죠. 이 컨테이너의 그룹을 파드(Pod) 라고 합니다.
즉, 파드란 쿠버네티스 환경의 가장 작은 하나의 단위로써, 하나 이상의 밀접하게 연관된 여러 컨테이너의 집합을 의미합니다.

여러 파드는 동일한 워커 노드에서 같은 리눅스 네임스페이스로 함께 실행됩니다. 각 파드는 자체 IP, 호스트 이름, 프로세스 등이 있는 논리적으로 분리된 머신입니다.

또 동일한 파드에 있는 여러 컨테이너는 서로 완벽히 격리된 프로세스를 보장합니다.

### 파드 조회

```java
kubectl get pods
```

앞서 `create` 명령어로 만든 클러스터의 모든 파드를 조회해봅시다. 쿠버네티스에서 가장 기본적인 단위는 컨테이너가 아닌 파드라고 했습니다. 따라서 개별 컨테이너를 조회할 수 없는대신, 위 명령어처럼 파드를 조회해야 합니다.

```java
$ kubectl get pods
NAME                     READY     STATUS    RESTARTS   AGE
kiada-9d785b578-p449x    0/1       Pending   0          1m
```

만약 이때 위처럼 파드의 status 가 Pending 라면 파드에 아직 컨테이너가 준비되지 않은 상태입니다. 워커 노드가 컨테이너를 실행하기전에 컨테이너 이미지를 다운로드하는 중이기 때문이죠. 다운로드 완료후 파드에 컨테이너가 생성되면 status 가 Running 으로 바뀌게됩니다.

### 백그라운드에서 발생한 동작 메커니즘

![](https://velog.velcdn.com/images/msung99/post/245667dd-b69c-4e65-8168-e1cba90a1e6a/image.png)

#### 1. Deloyment Controller 생성

앞서 `create` 로 만든 클러스터 생성 메커니즘을 자세히 알아봅시다. 우선 `kubectl` 클라이언트 명령어를 실행하면 쿠버네티스의 API 서버로 REST HTTP 요청을 전달하고, 클러스터에 배포 객체인 **Deloyment Controller 를 마스터 노드(Control Plane) 에 생성**합니다.

#### 2. 새로운 파드를 생성하고, 해당 파드를 특정 워커노드에 스캐줄링한다

Deloyment 컨트롤러는 새로운 파드를 생성하고 스캐줄러(Scheduler) 에 의해 워커 노드 중 하나에 `스케줄링(Scheduling)` 이 됩니다. 이때 주의할점은, **스케줄링이란 파드가 특정 노드에 할당됨을 뜻하는 것**입니다. (기존에 저희가 알던 스캐줄링과 다른것입니다!)

#### 3. Kubelet : 이미지 pull 명령

해당 워커 노드의 Kubelet 은 파드가 스케줄링됐다는 것을 보고 이미지가 로컬에 없기 때문에, 도커에게 레지스트리(DockerHub) 로부터 이미지를 pull 받으라고 명령을 지시합니다.

#### 4. 컨테이너 실행

직전에 Kubelet 은 도커한테 이미지를 pull 받도록 했었죠? 그렇게 pull 받은 이미지에 기반하여 컨테이너를 실행합니다.

---

## 서비스 객체 : 로드밸런서 & Public IP 노출시키기

위 과정까지 따라했다면 클러스터에 워커노드가 생성되고, 그 안에 파드가 생성되며 또 그 안에는 애플리케이션이 도커 컨테이너에 의해 격리된 프로세스로써 실행되고 있을겁니다. 그렇다면 실행중인 여러 파드에는 어떻게 접근할 수 있을까요?

### 특정 파드를 어떻게 외부에서 접근하지?

#### 그냥 서비스(Cluster IP)를 생성해버린다면?

각 파드는 자체 IP 주소를 가지고 있지만, 이 주소는 클러스터 내부에 있으며 외부에서 접근이 불가능합니다. 외부에서 파드에 접근할 수 있게하려면 서비스 오브젝트를 통해 노출해야합니다. 하지만 서비스 오브젝트로 일반적인 서비스(Cluster IP) 를 생성해버리면 이것은 클러스터 내부에서만 접근 가능하기 때문에 특별한 서비스 유형인 `로드밸런서` 를 생성해야합니다.

#### 로드밸런서로 퍼블릭 IP 를 유출시키자.

외부에서도 access 가능하도록 로드밸런서 유형의 서비스를 생성하고, 퍼블릭 IP 를 유출시켜서 파드에 연결합시다.

```java
kubectl expose deployment kubia --type=LoadBalancer --port 8080
```

기존에 `create` 명령어로 deployment 배포 객체를 생성했다면, 위와 같이
`expose` 은 서비스 객체를 생성하는 것입니다. 또 서비스 객체의 타입을 로드밸런서로 명시해준 것이죠.

### 서비스 조회하기

```java
kubectl get svc
// 또는
kubectl get services
```

앞서 생성한 서비스 객체의 상세내역을 조회할떄 사용하먄됩니다. 아래와 같이 서비스의 타입과 클러스터 내부에서 접근할때 활용가능한 Cluster IP, 그리고 외부에 유출된 Exteranl IP (퍼블릭 IP) 를 조회 가능하죠.

```java
NAME         TYPE          CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
kubernetes   ClusterIP     11.11.111.1    <none>        443/TCP         34m
kudia        LoadBalancer  2.22.222.22   <pending>     8080:30838/TCP  4s
복사
```

### 로드밸런서 서비스 제공받는 메커니즘

![](https://velog.velcdn.com/images/msung99/post/78859bcb-c66b-47d3-b386-70103e240f5c/image.png)

이때 유의할점은 로드밸런서 타입의 서비스 객체가 생성되지만, 로드 밸런서 자체를 제공하지 않습니다. 클러스터가 클라우드에 배포된 경우 쿠버네티스는 **클라우드 인프라한테 로드밸런서를 제공해달라하고, 트래픽을 클러스터로 전달하도록 요청하는 것**입니다. 만약 get 명령어로 서비스를 조회했을 때 External IP 가 < pending > 상태라는 것은, 아직 인프라로 부터 로드밸런서를 제공받지 못해서 기다리고 있는 상태라는 뜻이 되겠죠.

### 핵심 명령어 2가지

지금까지 진행한 과정중 핵심적인 명령어를 2개만 정리해보자면 다음과 같습니다.

> - kubectl create deployment : depolyment 컨트롤러 생성 및 컨테이너 실행

- kubectl expose deployment : 로드밸런서 & External IP 유출

### Minikube 에서 로드밸런서 IP 를 어떻게 유출시키는거야 ?!

또 로드밸런서와 관련해 한가지 더 말씀드리면, Minikube 로컬에서 클러스터를 구성한경우 LoadBalancer 타입의 서비스 자체가 존재하지 않아서, 외부 IP 를 유출시키는 것이 불가능합니다.
따라서 MetaLIB 를 활용하면 해결되기 때문에 아예 방법이 없는것은 아니지만, 가급적이면 AWS, GLB 와 같은 클라우드 서비스 자체에서 제공해주는 로드밸런서 기능을 활용합시다. 즉 클라우드 인프라에 Minikube 에 기반한 클러스터를 구축하는 것이 좋다는 것이죠.

또한 계속 로드밸런서 서비스 객체가 계속 `<Pending>` 상태에 빠질 수 있는데, 이 경우 minikube 가 제공하는 ssh 터널링 기능을 사용하면 외부 IP 가 정상적으로 할당 및 유출됩니다.

```java
minikube tunnel
```

위와 같이 터미널에 접속한후 새로운 터미널 창을 실행시켜서 인프라 서버에 접속후, minikube 를 실행시킨 유저 계정으로 로그인하시면 외부 IP 가 아래처럼 할당되는 모습을 볼 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/11771e80-0c56-4022-9710-e81646eb56b5/image.png)

---

## 애플리케이션 수평확장(Scale Out)

마지막으로 수평 확장을 시켜봅시다. 기존 클러스터에 존재하는 파드(Pod)를 조회해보면 1개가 존재합니다. 하지만 파드 1개로는 대규모 트래픽을 감담하기 힘들며, 트래픽을 분산하고 감당하도록 추가 인스턴스(파드)를 실행해야합니다. 이를 수평확장(Scale Out) 이라고 하죠.

### 파드 개수 확장

아무 설정이 없다면, 기본적으로 애플리케이션의 단일 인스턴스(파드) 를 실행합니다. 추가 확장을 원하면 아래처럼 배포 객체를 확장하면 끝입니다.

```java
$ kubectl scale deployment kiada --replicas=5
```

위와같이 명령어 딱 1줄로 파드의 복사본을 5개 실행하도록 지정했습니다. 각 파드에는 단일 컨테이너가 할당 및 실행되고 있는 상태가됩니다.
이렇듯 언제든 확장이 필요할때 새로운 복제본을 수동으로 설치하고 실행하지 않더라도 명령어 하나로 파드를 추가할 수 있습니다.

### 파드 조회

앞서 확장시킨 파드들을 모두 조회해봅시다. 우선 `deploy` 를 사용시 파드가 READY 상태에 있는 파드가 5개 존재합니다.

```
$ kubectl get deploy
```

![](https://velog.velcdn.com/images/msung99/post/457905dc-1821-4073-95d3-1b092655937f/image.png)

### 동일한 워커 노드에서 실행되고 있을까?

```java
$ kubectl get pods -o wide
```

또한 단일 노드 클러스터를 사용하느 경우, 모든 파드가 동일한 노드에서 실행됩니다. 그러나 다중 노드 클러스터에서는 5개의 파드가 모두 클러스터의 노드들에 골구로 분산되어야합니다. 이를 위해 자세한 파드 목록을 조회해봅시다.

우선 저희는 Minikube 에 기반한 단일 노드 클러스터를 구축했기 떄문에 5개의 파드는 모두 동일한 노드에 존재하는 모습을 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/6f735f0f-5e33-44c9-b25e-ad68ca28bbfc/image.png)

만약 다중 노드 클러스터였다면 아래와 같은 모습이였겠죠?

```java
$ kubectl get pods -o wide
NAME                   ...  IP          NODE
kiada-9d785b578-58vhc  ...  10.244.1.5  kind-worker
kiada-9d785b578-jmnj8  ...  10.244.2.4  kind-worker2
kiada-9d785b578-p449x  ...  10.244.2.3  kind-worker2
```

### 클라이언트의 요청은 여러 파드에 어떻게 분산될까?

그런데 의문이 생깁니다. 로드밸런서를 구축했을떄 항상 동일한 애플리케이션 인스턴스를 호출할까요?

여러 요청들은 무작위로 다른 파드에 골구로 분산됩니다. 즉, **하나 이상의 파드가 서비스 뒤에 존재할때, 서비스는 다수의 파드 앞에서 로드밸런서 역할을 적절히 수행**하죠.

---

## 파드와 노드의 관계

또 쿠버네티스에서는 파드가 적절히 실행하는데 필요한 CPU 와 메모리를 제공하는 노드에 스캐줄링됐다면, 어떤 노드에 파드가 실행 중인지는 중요하지 않습니다.

파드가 스케줄링된 노드와 상관없이 컨테이너 내부에 실행중인 모든 애플리케이션은 동일한 유형의 운영체제 환경을 가집니다. 각 파드는 자체 IP 를 가지고, 다른 특정 파드가 같은 노드에 위치해있는지 다른 노드에 위치했는지 신경쓸 필요도 없습니다.

---

## Minikube 대시보드

마지막으로 Minikube 를 활용시 쿠버네티스 클러스터를 활용중이라면 대시보드를 활용해봅시다.

```java
$ minikube dashboard
```

---

## 참고

[Kubernetes in Action, Second Edition](https://www.manning.com/books/kubernetes-in-action-second-edition)
[minikube와 kubectl로 간단한 예제 서비스 배포해서 실행해보기](https://wiki.terzeron.com/ko/OS_%EC%9D%BC%EB%B0%98_%EC%8B%9C%EC%8A%A4%ED%85%9C/Docker/minikube%EC%99%80_kubectl%EB%A1%9C_%EA%B0%84%EB%8B%A8%ED%95%9C_%EC%98%88%EC%A0%9C_%EC%84%9C%EB%B9%84%EC%8A%A4_%EB%B0%B0%ED%8F%AC%ED%95%B4%EC%84%9C_%EC%8B%A4%ED%96%89%ED%95%B4%EB%B3%B4%EA%B8%B0)
[k8s - 2-b. k8s 실습](https://velog.io/@roon-replica/k8s-2-b.-k8s-%EC%8B%A4%EC%8A%B5)
