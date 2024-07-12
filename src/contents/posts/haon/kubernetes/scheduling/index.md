---
title: 쿠버네티스(Kubernetes) 파드, 워커노드를 활용한 스캐줄링 방법
date: "2023-03-26"
tags:
  - 쿠버네티스
  - MSA
previewImage: book.png
---

[[Kubernetes] 클러스터의 파드(Pod) 배치 아키텍처와 YAML 디스크립터로 파드 관리하기](https://velog.io/@msung99/Kubernetes-%ED%81%B4%EB%9F%AC%EC%8A%A4%ED%84%B0%EC%9D%98-%ED%8C%8C%EB%93%9CPod-%EB%B0%B0%EC%B9%98-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98%EC%99%80-%EB%94%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%84%B0%EB%A1%9C-%ED%8C%8C%EB%93%9C-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0) 에서 살펴봤듯이, YAML 또는 JSON 디스크립터를 통해 새로운 파드를 생성하고 스캐줄링 할 수 있습니다. 이 내용에 이이서 파드에 대해 레이블, 레이블 셀렉터, 네임스페이스를 활용하여 어떻게 파드 관리를 효율적으로 할 수 있는지에 대해 다루어보고자 합니다.

---

## 클러스터의 파드의 수가 너무 많아졌다!

클러스터에서 애플리케이션을 배포할 때 그 규모가 커질수록 파드 수가 증가하고 세부적인 여러 부분 집합으로 나눌 필요가 있습니다. 특히 마이크로서비스 아키텍처의 경우 파드의 수만 무려 20개 이상을 넘게됩니다.

따라서 모든 개발자와 관리자는 어떤 파드가 어떤 것인지 손쉽게 식별할 수 있도록 임의의 기준에 따라 작은 그룹으로 조직화하는 방법이 필요합니다. 각 파드에 대해 개별적으로 작업을 수행하기보다, 특정 그룹에 속한 모든 파드에 관해 한번에 작업하기를 원할 것이죠.

이를위해 등장한 것이 레이블, 레이블 셀렉터, 네임스페이스입니다. 이들로 파드와 기타 쿠버네티스 오브젝트에 대한 조직화를 수행할 수 있죠.

---

## 레이블 (labels)

레이블은 K8S 오브젝트에 첨부하는 Key-value 값으로, 마치 파드에 표딱지처럼 붙여놓는 식별자로 이해하면 쉽습니다. 또 key-value 쌍은 레이블 셀렉터를 사용해 원하는 리소스를 추출해낼 때 사용됩니다.
클러스터에 접속하는 개발자 및 운영자는 각 파드의 레이블을 보고 시스템 구조와 각 파드가 무슨 기능을 하는지를 파악하고, 어떤 적합한 위치에 존재하는지 확인할 수 있게됩니다.

예를들어 아래와 같이 여러 종류의 파드가 클러스터 내에 존재한다고 해봅시다. 이들은 마이크로서비스 아키텍처 안에서 분류되지 않은 상태입니다.

![](https://velog.velcdn.com/images/msung99/post/40b2fde3-f1b3-4aaa-a599-b1597eb05880/image.png)

이 상황에 각 파드에 레이블을 붙여서 누구나 쉽게 이해할 수 있는 체계적인 시스템을 구성해봅시다. 각 파드에는 아래처럼 2개의 레이블을 임의로 붙여봤습니다.

![](https://velog.velcdn.com/images/msung99/post/413f30f3-dab8-4851-9991-d8d2c249d47f/image.png)

우선 app 이라는 레이블을 정의해줬습니다. 파드가 속한 애플리케이션, 구성요소를 설명해주는 레이블이죠. 또 rel 이라는 레이블로 정의해줬는데, 이는 해당 파드에서 실행중인 애플리케이션이 출시 버전인지, 베타 버전인지를 설명해주는 레이블입니다. 즉 rel 레이블이 붙은 파드는 key 값이 rel 이며, value 값에는 beta, release 와 같은 값들이 할당될겁니다.

### 파드 생성시 레이블 지정

이제 파드에 레이블을 붙이는 방법을 알아봅시다. 우선 YAML 파일로 파드 생성시 lables 옵션으로 레이블을 생성 및 지정해줄 수 있습니다.

```java
// kubia-manual-with-labels.yaml 파일
apiVersion: v1
kind: Pod
metadata:
  name: kubia-manual-ver2
  labels:       // 레이블 생성 => creation_method, env 라는 2개의 레이블을 생성함
    creation_method: manual
    env: prod
spec:
  // ... (이하 생략)
```

앞서 생성한 yaml 파일에 기반하여 파드를 생성합시다.

```java
$ kubectl create -f kubia-manual-with-labels.yaml
```

이어서 파드를 조회하는데, 그냥 get pods 명령어는 레이블을 표시하지 않으므로
`--show-labels` 를 사용해서 레이블 필드까지 함께 조회해봅시다.

```java
$ kubectl get po --show-labels
```

출력결과

```java
NAME			READY	STATUS	  RESTARTS	LABELS
kubia-manual    1/1	    Running    0        <none>
kubia-manual2	1/1     Running    0        create_method=manual,env=prod
```

만약 특정 레이블에만 관심있을 경우 -L 옵션을 부여해줍시다.

```java
$ kubectl get po -L creation_method,env
```

### 기존 파드 레이블 수정

또 기존 파드에 레이블을 추가하거나 수정할 수 있습니다.
아래는 creation_method=manual 레이블을 추가하는 과정입니다.

```
$ kubectl label po kubia-manual creation_method=manual
```

또 기존 레이블을 변경시에는 `--overwrite` 옵션을 사용하면 됩니다.

```
$ kubectl label po kubia-manual-v2 env=debug --overwrite
```

실행결과

```java
$ kubectl get po --show-labels

NAME			READY	STATUS	  RESTARTS	LABELS
kubia-manual    1/1	    Running    0        creation_method=manual
kubia-manual2	1/1     Running    0        create_method=manual,env=prod
```

---

## 레이블 셀렉터를 이용한 파드 부분집합 나열

앞서 레이블을 각 파드에 부착시킨후, 레이블 셀렉터를 활용하면 특정 레이블로 태그된 파드의 부분 집합을 선택해 원하는 작업을 수행할 수 있습니다.
**레이블 셀렉터는 특정 값과 레이블을 갖는지 여부에 따라 리소스를 필터링하는 기준이 됩니다.**

레이블 셀렉터는 리소스 중에서 다음 기준에 따라서 리소스를 선택합니다.

> - 특정한 키를 포함하거나 포함하지 않는 레이블

- 특정한 키와 값을 가지는 레이블
- 특정한 키를 갖고 있지만, 다른 값을 가진 레이블

```java
$ kubectl get po -l creation_method=manual  // creation_method=manual 레이블을 가지는 모든 파드조회
$ kubectl get po -l env         // env 레이블 key 를 가지는 모든 파드조회
$ kubectl get po -l '!env'    // env 레이블을 가지고있지 않은 모든 파드조회
$ kubectl get po -l env!=manual  // env 레이블을 가지는 파드중에 value 가 manual 이 아닌 모든 파드조회
$ kubectl get po -l env in (prod,devel) //  env 레이블 value 값이 prod 또는 devel 인 파드
$ kubectl get po -l evn notin (prod,devel)
```

---

## 워커 노드에 레이블을 적용해 파드 스캐줄링 제한하기

지금까지 생성한 모든 파드는 워커 노드 전반에 걸쳐서 무작위로 스캐줄링 되었습니다. 쿠버네티스에서 파드가 어떤 노드에 스캐줄링 되었는지는 중요하지 않기 떄문이죠.

하지만 **아주 간혹 파드를 스캐줄링할 위치를 정해야 할때**가 있습니다. 에를들어 각 워커노드의 하드웨어 구성이 동일하지 않은경우를 생각해볼 수 있습니다. 한 워커노드는 HDD 를 가지고 있고, 나머지 모든 노드들은 SSD 를 가지고있는 경우, 한 파드를 한 그룹에만 스캐줄링하고 나머지 파드들은 다른 그룹에다 스캐줄링되도록 할 수있죠.

앞서 언급했듯이, 노드를 포함한 모든 쿠버네티스 오브젝트에 레이블을 부착할 수 있습니다. 예를들어 GPU 를 가지고 있는 노드에 레이블을 표기할때 아래처럼 하면 됩니다.

```java
$ kubectl label node my-kubia gpu=true // 노드에 레이블 표기
$ kubectl get nodes -l gpu=true  // 레이블 셀렉터로 원하는 노드 추출
```

### 특정 노드에 파드 스케줄링하기

앞서 GPU 에 존재하는 워커노드에 레이블 표기를 했다면, 이를 활용해 YAML 파일을 작성해서 해당 워커노드에 특정 파드를 스캐줄링 할 수 있습니다.
아래처럼 spec 섹션안에 nodeSelector 필드에다 정보를 추가해주면 됩니다. 파드를 생성할 때 스케줄러는 gpu=true 레이블을 가지고 있는 노드중에서 선택해서 스캐줄링합니다.

```java
apiVersion: v1
kind: Pod
metadata:
  name: kubia-gpu
spec:
  nodeSelector:
    gpu: "true"
  containers:
  - image: msung99/redis-lock:0.1.3
    name: kubia
```

---

## 네임스페이스를 사용한 그룹화

그런데 레이블을 활용하다보면 한계점이 있습니다. 각 파드에 레이블을 표기하고 그룹화할 수 있는데, 각 오브젝트는 여러 레이블을 가질 수 있기 때문에, **오브젝트 그룹은 서로 겹쳐질 수 있습니다.**

### 오브젝트를 겹치지 않는 그룹으로 분할하고 싶을때?

그렇다면 오브젝트를 겹치지 않는 그룹으로 분할하고 싶을때는 어떻게할까요? 한 번에 하나의 그룹 안에서만 작업하고 싶을겁니다. 이런 이유로 오브젝트를 네임 스페이스로 그룹화합니다. 이때 네임스페이스란 프로세스를 격리하는 리눅스 네임스페이스가 아님에 주의합시다.

네임스페이스는 모든 리소스를 하나의 단일 네임스페이스에 두는 대신에 여러 네임스페이스로 분할할 수 있고, 이렇게 분리된 네임스페이스는 같은 리소스 이름을 다른 네임스페이스에 걸쳐 여러 번 사용할 수 있게 됩니다.

```java
$ kubectl get ns  // 모든 네임스페이스 조회

NAME			LABELS 		STATUS		AGE
default 		<none>		Active		1h
kube-public		<none>		Active		1h
kube-system		<none>		Active		1h
```

위와 같이 네임스페이스를 조회해봅시다. 저희는 지금까지 kubectl get 명령어를 이용하여 리소스를 나열할때 네임스페이스를 명시한 적이 없기때문에, default 네임스페이스에서만 작업을 진행한 것입니다.
즉, **kubectl 명령어는 항상 기본적으로 default 네임스페이스에 속해있는 오브젝트들만 표시한 것입니다.**

```java
$ kubectl get po --namespace kube-system
```

또 위 명령어를 사용시 여러 파드들이 출력되는데, 이 파드들은 추후 다루겠습니다.

### 네임스페이스를 왜 사용해야할까?

네임스페이스를 사용해 서로 관계없는 리소스를 겹치지 않는 그룹으로 분리할 수 있습니다. 여러 사용자 또는 그룹이 동일한 쿠버네티스 클러스터를 사용하고 있고, 각자 자신의 리소스를 관리한다면 각각 고유한 네임스페이스를 사용해야합니다.

이렇게 하면 **다른 사용자의 리소스를 사용하거나 수정 및 삭제하지 않도록 주의를 기울일 필요가 없습니다.** 또 네임스페이스가 리소스 이름에 관한 접근범위를 제공해주므로 **리소스 이름이 충돌하는 경우를 걱정할 필요가 없습니다.**

### 네임스페이스 생성

1. YAML 으로 아래처럼 생성 가능합니다.

```java
apiVersion: v1
kind: Namespace     // 오브젝트 타입을 네임스페이스로 명시
metadata:
  name: custom-namespace   // 네임스페이스 이름
```

2. 또 명령어 한줄로도 생성 가능합니다.

```java
$ kubectl create namespace my-namespace
```

### 리소스(오브젝트) 생성시 네임스페이스 부여

기존에 생성해둔 네임스페이스가 있을때, 파드와 같은 오브젝트를 생성할때 네임스페이스를 할당 가능합니다.

```java
$ kubectl create -f kubia-manual -n my-namespace
// my-namespace 네임스페이스는 예전에 만들어 둔것. kubia-manual 라는
// 새로운 파드 오브젝트 생성시 네임스페이스를 할당해줌
```

---

## 파드 중지와 제거

마지막으로 파드를 중지하고 제거하는 방법에 대해 자세히 다루어보겠습니다.

### 이름으로 파드 삭제

```java
$ kubectl delete po my-pods
```

파드를 삭제하면 그 안의 모든 컨테이너는 종료됩니다. 쿠버네티스는 `SIGTERM` 신호를 프로세스에 보내고 지정된 시간(기본값 30초) 동안 기다리다가, 시간내에 종료되지 않으면 `SIGKILL` 신호를 통해 종료시킵니다.

### 레이블 셀렉터로 파드 삭제

레이블 셀렉터로 파드를 모두 중지 및 삭제할 수 있습니다.

```java
$ kubectl delete po -l creation_method=manual
```

### 네임스페이스로 파드 삭제

마찬가지로 네임 스페이스로 파드를 모두 중지 및 삭제할 수 있습니다.

```java
$ kubectl delete ns my-namespace
```

또 특정 파드를 삭제하는 대신 `--all` 옵션으로 현재 네임스페이스에 있는 모든 파드를 삭제하도록 할 수 있습니다.

```java
$ kubectl delete po --all
```

### 모든 리소스 삭제

마지막으로, 하나의 명령으로 현재 네임스페이스에 있는 모든 종류의 오브젝트(Deployment Controller, 파드, 서비스) 를 모두 삭제시킬 수 있습니다.

```java
$ kubectl delete all --all
```

---

## 참고

[Kubernetes in Action, Second Edition](https://www.manning.com/books/kubernetes-in-action-second-edition)
