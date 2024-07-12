---
title: Git 브랜치 3가지 Merge 전략 (Squash, Rebase, Merge)
date: "2022-10-28"
tags:
  - git
previewImage: index.png
---

이번 포스팅에서는 Squash 에 대해 알아보겠습니다. 지난 포스팅에서 살펴본 Rebase 와 함께 커밋 히스토리를 관리하기 위한 방법 중 하나로써, Merge 할때 사용된다고 보시면 됩니다.

본 포스팅의 내용 흐름은 Squash 에 대한 이론을 설명드리고, **3가지의 Merge 전략(Merge, Squash and Merge, Rebase and Merge) 들의 특징을 비교**하는 방식으로 진행해 보겠습니다.

---

## 기존의 Merge 방식은?

![](https://velog.velcdn.com/images/msung99/post/78e6ae6a-3fdd-4b69-b359-7d5c795d4a75/image.png)

각 서브 브랜치의 작업 내용을 main 브랜치에 병합시에, Git 에서 제공하는 가장 간단한 방식으로 Merge 가 있었습니다. 병합시에는 새로운 Merge 커밋이 생성되는 모습을 확인할 수 있을겁니다.

Merge 에 대한 이론을 잘 모르신다면, 지난번 제 포스팅 링크를 참고하셔도 좋습니다.

https://velog.io/@msung99/%EB%B8%8C%EB%A0%8C%EC%B9%98Branch%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80-Merge-%EA%B3%BC-Conflic

위 예시의 경우, my_branch 브랜치에서 커밋 A, B, C 를 생성하고 main 브랜치에 병합하는 상황입니다. 명령어로 표현하면 아래와 같을 것입니다.

```
git checkout main
git merge my_branch
```

---

## Squash

> **여러번 커밋한 이력을 하나의 커밋 이력으로** 합친후 Merge 하는데 사용합니다.

![](https://velog.velcdn.com/images/msung99/post/07bf5f64-504d-4049-a917-31cac47ca1c6/image.png)

my_branch 브랜치에서 생성한 각 커밋 A, B, C 를 합쳐서 하나의 새로운 커밋을 생성하고 브랜치에 추가하는 명령이 바로 Squash 입니다.

이때 Squash 를 통해 새롭게 생성된 통합 커밋(커밋 A+B+C) 은 부모 커밋을 하나만 가지게 됩니다. 즉, Init 이라는 커밋이 있을때 통합 커밋은 Init 가 직전 커밋(부모 커밋) 이 되는 것이죠.

Squash 를 통해 통합커밋을 생성하는 명령은 아래와 같습니다.

```
git checkout main               // main 브랜치로 이동해서
git merge --squash my-branch    // my-branch 브랜치에 대한 통합 커밋을 생성하고
                                   main 브랜치에 병합하기 위한 명령
git commit -m "commit message"  // 통합 커밋을 생성
```

정리해보면, Squash 의 사용목적은 서브 브랜치의 여러 커밋들을 하나로 합쳐서 깔끔하기 만들기 위해 사용한다고 할 수 있겠습니다.

---

## Squash VS Rebase

rebase 를 아직 잘 모르시면 아래의 제 이전 포스팅 링크를 참고하세요!

https://velog.io/@msung99/Git-Rebase%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80

그렇다면 Squash 와 Rebase 의 차이에 대해서도 살펴보죠.
정리를 먼저 하자면 아래와 같습니다.

> - Squash : 서브 브랜치를 master 브랜치에 **병합시, 서브 브랜치의 커밋들에 대한 통합커밋 하나를 생성하고 병합시키는 방식**

---

- Rebase : Squash 처럼 따로 통합커밋을 하나 생성하고 master 브랜치에다 병합하는 방식이 아닌, **서브 브랜치의 여러 커밋의 뭉탱이를 뒤에 이어서 붙여주는 방식**

---

쉽게말해 Squash 는 통합커밋 딱 하나를 master 브랜치 뒤에 붙여주는 방식이고, Rebase 는 서브브랜치의 여러 커밋들을 뒤에 붙여주는 방식이다.

예시를 보면 더 이해가 잘 될겁니다. 아래의 방식은 서브 브랜치(my-feature) 를 Squash 해서 통합 커밋 ab 를 생성하고, 이 통합커밋을 develop 브랜치에서 merge 하는 방식입니다.

![](https://velog.velcdn.com/images/msung99/post/f0bf52d6-d461-4c7f-9381-878a47450aa4/image.png)

명령어로 표현하면 아래와 같습니다. (위에서 봤던 명령어랑 동일!)

```
$ git checkout develop
$ git merge --squash sub_branch
$ git commit -m "your-commit-message"
```

반면 아래는 rebase 방식입니다. 통합커밋 하나를 생성하는 것이 아닌, 서브 브랜치의 커밋 히스토리를 몽땅 다 가져와서 develop 브랜치에다 merge 하는 방식입니다.

![](https://velog.velcdn.com/images/msung99/post/a19c6950-46b1-41e4-aca6-ba416331e722/image.png)

명령어로 표현하면 아래와 같습니다.

```
$ git checkout sub_branch
$ git rebase develop
$ git checkout develop
$ git merge sub_branch
```

서브 브랜치는 rebase 를 진행해서 기존의 develop 브랜치에 커밋들이 이어서 추가가 되었습니다.

---

## Squash 와 Rebase 를 적극 활용해보자

만일 Merge 만 사용한다면 아래와 같은 복잡한 커밋 히스토리 구조가 나올 수 있으나,

![](https://velog.velcdn.com/images/msung99/post/202c180d-244f-4b1b-aa17-2900f2ee2502/image.png)

Squash 와 Rebase 를 잘만 사용한다면 아래처럼 커밋 히스토리가 단순한 구조로 예쁘게 변경되는 것을 볼 수 있을것입니다.

![](https://velog.velcdn.com/images/msung99/post/234bd264-c052-405d-839e-d02e6cf022a8/image.png)

---

## Merge 전략들을 비교

지금껏 브랜치를 병합하기 위한 3가지 Merge 전략(3-Way-Merge) 에 대해 살펴봤습니다. 각 전략에 대한 특징을 정리해보자면 아래와 같습니다.

![](https://velog.velcdn.com/images/msung99/post/5976f35f-38ef-4c08-8b14-b5023f2096d7/image.png)

팀이 실력이 아직 부족하다 느끼면, 이제 막 git으로 버전관리하는 법을 배우기 시작했다면 Squash and Merge가 좋을 겁니다.

---

### 참고 & 출처

https://cjw-awdsd.tistory.com/49

https://datalibrary.tistory.com/194

https://velog.io/@kmg2933/Git-Merge-Squash-Rebase-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0

https://inmoonlight.github.io/2021/07/11/Git-merge-strategy/
