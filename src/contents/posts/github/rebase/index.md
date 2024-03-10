---
title: Git Rebase를 쉽게 예제로 이해해보자!
date: "2022-11-1"
tags:
  - git
previewImage: index.png
---

안녕하세요, 이번 포스팅에서는 Rebase 에 대해 알아보겠습니다.
Rebase 를 잘 활용할 수 있다면 Merge 에 비해 commit 히스토리가 더 깔끔하게 관리가 되며, Conflict 가 발생할 일도 훨씬 적어집니다.

본 포스팅에서는 **Rebase 를 Merge 와 계속 비교하며 설명을 진행**하도록 하겠습니다.

---

## Rebase란?

Rebase 는 말 그대로 **base를 재설정한다는 의미**로, 하나의 브랜치가 다른 브랜치에서 파생되서 나온 경우, 다른 브랜치에서 진행된 커밋을 다시 가져와서 base 를 재설정한다는 것입니다.

> - Rebase 는 커밋의 시간에 관계없이 마지막에 merge 되는 브랜치의 커밋을 가장 뒤에 붙이는 전략입니다.

---

- 언제 사용하기 적합한가?
  => 내가 작업하던 브랜치에 main 브랜치 내용이 필요해서 적용시키고 싶을 때 사용
  ex) 내 브랜치를 작업하는 동안 main 브랜치가 변경되었고 Merge 하려고 했으나 충돌이 발생할때,
  내 브랜치에서 main 브랜치를 rebase 하고 main 으로 Merge 하면된다.

#### 특징 요약

1. Merge 와 Rebase 는 실행결과는 같아도, 커밋 히스토리는 달라진다.
2. Rebase 는 base 를 새롭게 설정한다는 의미로 이해하면 좋다.

---

## Rebase 와 Merge 의 특징

### Merge

- Merge 는 **브랜치를 통합**하는 것입니다.
- 병합을 하면 합쳐진 브랜치의 커밋 메시지가 중복으로 쌓이며, **새로운 Merge 커밋을 생성**합니다.

### Rebase

- base를 재설정한다는 의미로, 브랜치의 base를 옮깁니다.
- **브랜치는 base 지점을 가지고 있어, base 에서부터 코드를 수정합니다.**

---

## Rebase VS Merge

### Merge 과정

아래처럼 서브 브랜치(Feature 브랜치) 에다 main 브랜치를 Merge 를 시도할 경우, main 브랜치의 커밋을 feature 브랜치로 **병합을 함으로써 feature 브랜치에 새로운 커밋이 발생**합니다.

![](https://velog.velcdn.com/images/msung99/post/90efb11f-5e2c-4c57-81e4-c6b4d65c946b/image.png)

### Rebase 과정

main 브랜치에 커밋 A,B 가 존재하고 feature 브랜치가 생성되었다 해봅시다. 그리고 feature 브랜치에는 커밋 D, E 를 생성했을 때, main 브랜치에서 feature 브랜치를 rebase 시켜봅시다.

이는 곧 main 브랜치에서 feature 브랜치의 커밋 히스토리를 base 로 해서 커밋 이력을 재쟁렬한다는 의미입니다.

그러면 아래처럼 main 브랜치의 마지막 커밋 히스토리 맨뒤쪽에 이어서 feature 브랜치들의 커밋들이 뒤 이어서 붙게되는 구조를 보이게 됩니다.

즉, rebase 하여 C 지점으로 base 를 이동시켜서 두 브랜치의 코드를 합치는데, 이때 D, E 커밋은 새로 지정된 C 지점 이후로 정렬됩니다.

![](https://velog.velcdn.com/images/msung99/post/b81b773a-9a1b-4769-a8d1-d80b31897040/image.png)

> 브랜치 A 에 B 를 Rebase 한다면, 브랜치 A 의 맨 마지막 커밋에 꼬리를 물듯이 B 의 커밋 내역들이 뒤어서 달라붙게 됩니다.
> => 즉, **선형적인 히스토리 구조** 를 만들게됩니다.

---

## Rebase 가 뭔지 잘 이해가 안간다면?

자, 위의 말만 들어서는 무슨 소리인지 햇갈리실 수 있다고 생각합니다.
아래의 말을 잘 기억하신다면 rebase 에 대해 다시는 햇갈리지 않을 수 있다고 생각하니, 꼭 기억해두세요.

> - Rebase 란 현재 작업하는 브랜치에서 대상 브랜치를 base로 해서 커밋 이력을 재정렬한다고 볼 수 있습니다.

---

- 즉, Rebase란 현재 작업하는 브랜치를 대상 브랜치의 HEAD 로 부터 분기된 브랜치로 간주하겠다는 뜻이 되기도 합니다.

예시를 통해 보시면 더 이해가 잘 되실겁니다. 자, 우선 Merge 먼저 다시 보겠습니다. master 브랜치로부터 a 브랜치가 생성이 되고 Merge 가 되는 과정은 잘 아실것이라고 생각합니다.

![](https://velog.velcdn.com/images/msung99/post/2a15275b-c45b-4a50-99b3-848dda2f30d7/image.png)

### master 브랜치에서 a 브랜치를 rebase 하기

다음으로는 rebase 를 다시 살펴보죠. master 브랜치에서 a 브랜치를 rebase 한다면, a 브랜치의 HEAD 로 부터 master 브랜치가 분기된 브랜치로 간주하겠다는 의미가 됩니다. ( = master 브랜치의 base를, 기존의 base 에서 a 브랜치의 HEAD 를 base 로 새롭게 잡은 것 )

이때 a 브랜치의 HEAD 는 커밋 a2 가 있는 곳입니다. 따라서 커밋 a2 뒤쪽으로 부터 master 브랜치가 파생(분기)되어 커밋들이 생성되는 구조를 이루게 되죠.

![](https://velog.velcdn.com/images/msung99/post/b454012c-0ccd-433a-910c-01e004ea03c6/image.png)

### a 브랜치에서 master 브랜치를 rebase 하기

반대로 a 브랜치에서 master 브랜치를 rebase 한다면, master 브랜치의 HEAD 로 부터 a 브랜치가 파생(분기)되어 나오는 구조를 이루겠죠? 따라서 master 브랜치의 HEAD 인 커밋 m3 로부터 a 브랜치의 커밋들이 이어지는 구조를 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/d41562f1-8040-40ba-8491-8847bfa9af3b/image.png)

---

## Rebase의 Conflict 발생조건

### 1. main 브랜치 내용이 작업 중간에 변경되어서, 충돌이 발생할 수 있는 경우

앞서 언급 드렸지만, Conlict 를 해결하기 위해선 다음과 같은 상황에서 rebase 가 사용되면 좋습니다.

> 내가 작업하던 브랜치에 main 브랜치 내용이 필요해서 적용시키고 싶을 때 사용
> ex) 내 브랜치를 작업하는 동안 main 브랜치가 변경되었고 Merge 하려고 했으나 충돌이 발생할때,
> 내 브랜치에서 main 브랜치를 rebase 하고 main 으로 Merge 하면된다.

### 2. main 브랜치에서 rebase를 한 경우

결론부터 말씀드리면 충돌(Conflict) 를 피하고자 하면 다음과 같이 하면 됩니다.

> main 브랜치를 rebase 하는 행위는 가급적이면 피하자! (충돌 발생원인)

예제를 통해 Conflict 가 발생하는 상황을 직접 봅시다.
master 브랜치로부터 a 브랜치와 b 브랜치가 분기된 상황을 가정해봅시다.

![](https://velog.velcdn.com/images/msung99/post/73a9e100-c3d8-4d34-84c1-fc4d186aac64/image.png)

master 브랜치에서 a 브랜치를 rebase 하면 아래와 같이 m3 커밋이 없어지고 이를 대신한 새로운 커밋 m3 와 m4 가 자동 생성됩니다. ( master 브랜치가 a 브랜치의 HEAD 를 base 로 잡았기 때문이겠죠? )

![](https://velog.velcdn.com/images/msung99/post/b594dc87-9f2b-4db6-8fe0-b937fdf43549/image.png)

그러면 기존에 있던 커밋 m3 가 존재하던 master 브랜치로부터 b 브랜치가 분기되었는데, d 브랜치는 master 브랜치로부터 분기한 커밋 m3 가 없어지게 된 꼴이 됩니다.

추후에 b 브랜치를 master 브랜치에 병합시에 무수히 많은 Conflict 를 발생키므로, master 브랜치를 reabase 하는 행위를 피하는게 좋습니다.

---

## Fast-forward merge

Merge 를 통해 발생하는 **불필요한 Merge 커밋을 제거** 할 수 있습니다. Merge 를 하면 커밋 이력이 남기때문에 히스토리에 불필요한 커밋이 늘어나게 됩니다.

하지만 rebase 는 병합이 아닌 커밋 히스토리가 남기 때문에 작업이력을 확인하기 편합니다.

> 즉, 다른 브랜치의 커밋 이력 위에서 master 브랜치를 기준으로 다른 브랜치의 커밋이력을 깔끔하게 재정렬합니다.

이 또한 예시를 살펴보죠.
만일 git merge 만을 사용하여 히스토리를 관리했다면 아래와 같은 상황이 됩니다.

![](https://velog.velcdn.com/images/msung99/post/7d140df8-af30-4fbe-b7dd-369f1507a355/image.png)

그 뒤로 a 브렌치와 b 브렌치에서 차례대로 master 브렌치를 rebase 하는 상황을 생각해봅시다. 우선 전체적인 흐름은 아래와 같습니다.

![](https://velog.velcdn.com/images/msung99/post/2c600e04-792b-48e1-b0ae-b8eb44edee52/image.png)

a 브렌치에서 master 브렌치를 rebase 하고 merge 를 시도한다면 아래와 같은 상황이 됩니다. (여기서 m4 커밋은 Merge를 하면서 자동 생성된 Merge 커밋입니다)

![](https://velog.velcdn.com/images/msung99/post/8298b6bf-b58e-491c-b024-f78e5493697c/image.png)

이어서 b 브렌치도 master 브렌치를 rebase 한뒤에 merge 를 하면 아래와 같은 상황이 될 겁니다. (여기서 m5 커밋은 Merge를 하면서 자동 생성된 Merge 커밋입니다)

![](https://velog.velcdn.com/images/msung99/post/6d605ac6-db98-4e37-9e18-3fb9e346a365/image.png)

마치 a 브랜치의 작업이 끝난 뒤 b 브랜치가 분기하여 작업한 것 처럼 보이게 커밋 이력을 관리할 수 있습니다.

이렇게 하면 브랜치 끼리 커밋 이력이 섞이지 않아 커밋 이력 관리가 편해집니다.

---

## Rebase 관련 명령어 예시

명령어의 흐름 구조를 직접 살펴보겠습니다. 아래와 같은 명령어를 수행하는 상황을 가정해봅시다.

```
$ git checkout sub_branch
$ git rebase main
$ git checkout develop
$ git merge sub_branch
```

### 1. 상황가정

그리고 아래와 같은 초기의 커밋 히스토리를 가지고 있다고 가정해봅시다.
아래 브랜치는 main 브랜치로, 현재 커밋 1,2 를 보유하고 있습니다.

![](https://velog.velcdn.com/images/msung99/post/ea867b5d-0a38-4219-bc5b-ac5a89f47a14/image.png)

이 상태에서 sub_branch 를 생성하고, 커밋 5, 6, 7 을 생성했습니다.

그리고 동시에 main 브랜치에서도 작업이 일어났습니다. sub_branch 외에 또 다른 서브 브랜치가 생성되었고 커밋 3을 생성하고 main 브랜치에 Merge 를 진행해서 Merge 커밋 4가 생성된 상황입니다.

![](https://velog.velcdn.com/images/msung99/post/11958e07-a675-4337-968c-0b4e4c92401b/image.png)

그리고 각 브랜치를 쪼개보자면, 아래와 같은 커밋 히스트로리를 각각 보유하고 있을 겁니다.

![](https://velog.velcdn.com/images/msung99/post/69b02ddf-9040-4345-be0c-d8040d1be8f6/image.png)

이 상태에서 만일 sub_branch 의 작업내용인 커밋 5, 6, 7의 내용을 main 에 그냥 Merge 하려고 한다면 충돌이 발생하겠죠?

main 에 커밋이 1,2 가 그대로 있다면 상관없을텐데, 커밋의 변화가 생겼습니다.

즉, main 브랜치의 커밋 2에 이어서 뒤쪽에 sub 브랜치의 내용을 병합해서 새로운 Merge 커밋을 생성해야 하는데, **sub 브랜치 입장에서는 main 브랜치에 왠 뜬금없는 커밋 3, 4 가 존재해서 자신의 커밋 내용들을 병합시키지 못하고 충돌이 발생하게 될 겁니다.**

---

### 2. 서브 브랜치에서 main 브랜치를 rebase 하기

> 1. git checkout sub_branch
> 2. git rebase main

이떄를 위해 하는것이 뭐다? 지금까지 배웠던 Rebase 이겠죠. sub 브랜치에서 main 브랜치의 새로운 작업내용들인 커밋 3, 4를 끌고 와서 작업을 하고 Merge 시켜준다면 될겁니다. **즉, sub 브랜치에 main 의 커밋 내역을 카피해오고, 커밋들을 만들고 main 에 Merge 해주면 되는 것이죠!**

![](https://velog.velcdn.com/images/msung99/post/733839fd-86c6-432f-ad25-7bc36e1c80e1/image.png)

위 명령어들을 수행한 결과는 위와 같은 그림이 나올것입니다. rebase main 을 해줌으로써 커밋 3, 4가 sub 에도 생기게 되는 것이죠.

rebase 를 하고나서, sub 브랜치에서 커밋 5,6,7 을 생성하는 작업을 진행합니다.

---

### 3. main 브랜치에다 서브 브랜치의 내용을 병합시키기

> 3. git checkout develop
> 4. git merge sub_branch

자, sub 브랜치에서 커밋 5,6,7 을 생성하고 main 브랜치에 Merge 를 시켜줍시다.

기존의 main 브랜치가 아래와 같았다면,

![](https://velog.velcdn.com/images/msung99/post/fe5e4b6e-a4a6-4359-b120-4ba222730445/image.png)

Merge 를 하면 main 브랜치의 아래와 같이 변화할 겁니다.

![](https://velog.velcdn.com/images/msung99/post/6c26c6b5-324e-493b-aafb-21a9b4740d40/image.png)

뭐, 당연한 소리지만 sub 브랜치의 상황은 그대로겠죠. 변화가 없을겁니다.

![](https://velog.velcdn.com/images/msung99/post/4342f566-3d47-4a7f-8211-a3c8d6a83719/image.png)

---

#### 실제코드

master 브랜치의 히스토리 : init함수 -> add 함수 -> sub 추가
sub_branch 브랜치의 히스토리 : init함수 -> add 함수 -> cal2 클래스 -> cal2 클래스에 add 추가

![](https://velog.velcdn.com/images/msung99/post/e08dded4-576a-4d0d-90b0-0455bdc3f26b/image.png)

sub_branch 에서 master 브랜치를 rebase 하기

![](https://velog.velcdn.com/images/msung99/post/d4c63ff1-3a00-4937-9345-e4315122358a/image.png)

rebase 결과, master 브랜치의 HEAD 인 "sub 추가" 커밋뒤에 sub_branch 의 커밋들이 뒤이어 붙어있는 모습을 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/53c0cdcc-9b76-456e-b088-1b1876b22783/image.png)

그리고 master 브랜치로 이동해서 sub_branch 를 Merge 해줍시다.

![](https://velog.velcdn.com/images/msung99/post/ba5beecb-5847-4ec4-9fb3-4f5ea311f6e1/image.png)

그러면 위와 같이 master 와 sub_branch 가 똑같은 커밋 히스토리를 보이고 있습니다. 또한 쓸모없는 Merge 커밋도 생기지 않았습니다.
