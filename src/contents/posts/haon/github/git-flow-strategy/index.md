---
title: Git 브랜치 관리전략. Git Flow, GitHub Flow
date: "2022-10-28"
tags:
  - git
previewImage: index.png
---

안녕하세요, 이번 포스팅에서는 Git 브랜치 전략이라는 것에 대해 알아보도록 하겠습니다.

## Git 브랜치 전략이란 브랜치를 프로젝트의 목적성에 맞게 효과적으로 분할하고 관리하는 전략으로, 아주 중요한 브랜치 관리 전략이라고 할 수 있겠습니다.

## Git Branching 전략들

대표적인 브랜칭(Branching) 전략으로는 크게 2가지로 나뉩니다.

> - GitHub-Flow : GitHub 에서 간단하게 자제 제작한 단순한 구조의 브랜치 전략으로써, **Master 브랜치를 중심으로 운영**됩니다.

---

- Git-Flow : 브랜치를 크게 **5개의 브랜치로 구분 및 분할하여 관리**하는 전략으로, 현재 많은 기업들에서 사용하는 브랜치 전략입니다.

- 추가적으로 GitLab Flow 라는 것이 있지만, 이번 포스팅에서는 다루지 않도록 하겠습니다.

아래에서 더 자세히 설명드리겠지만, GitHub Flow 는 전략 특성상 GitHub 로 프로젝트를 아직 많이는 접해보지 못하신 분들이 많이 사용하기 좋은 전략입니다. (몰론 상황에 따라 다르지만요!)

브랜치를 복잡하게 여러개로 구분짓는 Git-Flow 전략에 비해서, 단순히 기능별 브랜치를 생성하고 Master 브랜치에 Merge 하는 전략이기 떄문에, 복잡성을 따졌을 때 GitHub Flow 가 확실히 직관적으로 이해하기 쉽고 복잡하지 않은 프로젝트 수준에서 사용하기 좋을 것입니다. 신경써야할 것들이 많이 다르죠.

---

## GitHub Flow 전략

![](https://velog.velcdn.com/images/msung99/post/a213e1a0-cfb1-43b2-bf9b-58c72a4bb877/image.png)

> Master 브랜치를 중심으로 브랜치들을 관리하는 전략

- 기능추가 와 버그수정 작업을 하는 브랜치를 Master 브랜치로 부터 파생시켜서 작업후 Master 브랜치에 Merge 하는 방식

Git-Flow 가 GitHub 에서 사용하기 복잡하기 때문에, 이에 대한 방안으로 나오게 된 브랜칭(Branching) 전략입니다.

앞서 설명드렸듯이 GitHub 에서 만든 단순한 구조의 브랜치 전략으로,
GitHub Flow 와 달리 기능 개발, 버그 수정 등의 **작업용 브랜치를 별도로 구분하지 않는 단순한 구조**입니다.

- 이 브랜칭 전략은 수시로, 자주 CI 및 배포가 일어나는 프로젝트에 유용합니다.

---

### GitHub Flow(흐름) 순서

브랜치 생성부터 시작해서 Merge를 하고, 공개 및 테스트까지 하는 일련의 과정 및 흐름속에서 GitHub Flow 에서 제공하는 방법에 대해 알아보겠습니다.

![](https://velog.velcdn.com/images/msung99/post/4f2dd465-ce7a-47a6-acc7-5df516c6ad0c/image.png)

#### 1. 브랜치 생성

- Master 브랜치로부터 기능추가, 버그수정을 위한 새로운 브랜치가 셍성되어야 합니다. 즉, **기능추가 와 버그수정 작업을 하는 브랜치는 모두 Mater 브랜치로부터 파생**되어 나옵니다.

- 새로운 기능을 추가하거나, 버그 해결을 위한 브랜치들의 이름은 **자세하게 어떤 일을 하고 있는지에 대해서 작성**해주도록 합시다.

- Git-Flow 와 달리 feature, develop 브랜치가 존재하지 않습니다.

#### 2. commit message

- 커밋 메시지는 명확하고 간결히 작성되어야 합니다.
- 작업을 하며 각 기능별로 commit을 진행해주어야 합니다.
- **commit 은 서버(원격 레포지토리)의 동일한 브랜치에 push 해주어야 합니다. (Git Flow 와의 차이점)**

#### 3. PR (Pull Request)

앞서 브랜치를 생성할때 기능추가 와 버그수정 작업을 진행하기 위한 브랜치를 생성했을겁니다. 생성한 브랜치에서 기능 또는 오류 수정등을 완료했다면, PR 을 Master 브랜치에 보내면 됩니다.

- 즉, **PR 은 코드 리뷰를 도와주는 시스템**으로써 보고, Merge 할 준비가 완료되었다면 PR 를 올려서 자신의 코드를 공유하고 피드백과 리뷰를 받는 방식입니다.

#### 4. 리뷰와 논의하기

- PR 에 대한 코드를 읽어보고, 리뷰어는 피드백을 작성하면 됩니다.
- Merge 직전의 단계로써, 곧바로 Product 로 반영이 될 기능이므로 충분히 논의와 리뷰를 하고나서 반영하도록 합시다.

ex) 리뷰내용 : 작성한 코딩 스타일이 프로젝트 가이드라인과 부합하지 않는다.

#### 5. 공개 및 테스트

- 깃허브에서는 Master 브랜치에 **Merge 이전에, 긱 브랜치에서 코드를 공개 및 테스트 할 수 있습니다.**
- PR 에 대한 논의와 테스트가 끝난 경우 테스트 버전으로써 공개할 수 있습니다.

- Branch의 검증이 완료되면 메인 브랜치에 합치면 됩니다.

- 만일 오류가 발생했다면, 기존의 Master 브랜치를 다시 배포하고 roll back 하는 방식으로 되돌아와서 오류를 수정하면 됩니다.

---

## Git Flow 전략

다음은 Git Flow 전략입니다. 현재 많은 기업에서 표준으로 사용하고 있는 브랜치 전략입니다.

![](https://velog.velcdn.com/images/msung99/post/4a4674c3-080b-4cb2-b0f6-ca141b5fd677/image.png)

![](https://velog.velcdn.com/images/msung99/post/ccf0954b-7f54-42aa-ae08-b680a91c1b77/image.png)

> GitHub Flow 와 다르게 크게 5개의 브랜치로 운영하여 관리하는 전략입니다.

1. 메인 브랜치 : master, develop
2. 보조 브랜치 : feature, release, hotfix

배포 주기가 길고 팀의 여력이 있는 경우가 사용하기 적잡한 전략입니다.
그리고 각 브랜치의 특징을 정의해보자면 아래와 같습니다.

> - 메인 브랜치

1. master : 실제 제품으로 배포 및 출시되는 브랜치
2. develop : 다음 출시 버전을 기다리는 브랜치

---

- 보조 브랜치

3. feature : 기능을 개발하는 브랜치
4. release(QA) : 이번 출시 버전을 준비하는 브랜치. QA 브랜치라고도 불린다.
5. hotfix : 출시 버전에서 발생한 버그를 수정하는 브랜치. 수정이 완료되면 삭제된다.

---

### 메인 브랜치(Main Branch)

![](https://velog.velcdn.com/images/msung99/post/bb536d76-b096-4e98-b286-a2c160a40438/image.png)

- master 와 develop 브랜치 두 종류를 보통 메인 브랜치로써 병행해서 사용합니다.

#### master 브랜치

- 배포 가능한 상태만을 관리하는 브랜치

#### develop 브랜치

- 다음 버전으로 배포할 것을 개발하는 브랜치
- develop 브랜치는 통합 브랜치의 역할을하며, 평소에는 이 브랜치를 기반으로 개발을 진행

---

### 보조 브랜치(Sub branch)

보조 브랜치에는 feature, release(QA), hotfix 총 3가지의 브랜치가 있습니다.
**사용을 다 마치면 브랜치를 삭제한다는 특징** 을 지니고 있습니다.

#### 1. Feature 브랜치

![](https://velog.velcdn.com/images/msung99/post/e1092a94-69a9-4b93-8402-ebbc1bd3c044/image.png)

> 특징1) feature 브랜치는 하나의 **새로운 기능을 만들 때 생성**합니다.

feature 브랜치는 새로운 기능 단위를 만들고자 할떄 develop 브랜치로부터 분기(파생)됩니다.

다음 배포에 확실히 넣을 것이라고 판단될 떄 merge 하고, 결과가 실망스럽다면 아예 버리는 방식입니다.

> 특징2) 브랜치가 분기된 곳/Merge 해야하는 곳 : develop 브랜치

기능을 개발하는 브랜치들로써, develop 브랜치로부터 분기한 브랜치입니다.

> 특징3) 이름 : feature-브랜치명

- master, develop, release-_, hotfix-_ 를 제외한 모든 이름을 지을 수 있습니다.

위 브랜치 명들은 feature 브랜치를 제외한 나머지 4가지의 브랜치로, 당연히 이러한 브랜치 명을 적는다면 브랜치의 명확성이 떨어지게 될 것입니다.

> 특징4) develop 에 merge 한 이후에는 해당 브랜치는 삭제시켜준다.

말 그대로 기능 개발이 완료되었고 develop 브랜치에 merge 해주었다면 해당 feature 브랜치를 삭제시켜주도록 하는것이 원칙입니다.

> 특징5) merge 할때는 **--no--ff 키워드를 사용해서 기록을 그룹화**한다.

- --no--ff : Fast-forward 관계에 있어도 merge commit 을 생성해서 해당 브랜치가 존재했다는 정보를 남길 수 있고, commit 기록을 되돌리기 편해집니다.

위 키워드를 사용하지 않는다면, 브랜치 존재 여부를 몰라서 어떤 commit 부터 해당 기능을 구현했는지 확인하기가 어렵습니다.

---

#### 2. Release 브랜치

![](https://velog.velcdn.com/images/msung99/post/60749f57-0c83-4540-a885-4a19c7ce9e36/image.png)

> 특징1) 다음 버전 출시를 위해 QA 를 진행하는 브랜치

배포를 위한 최종적인 버그 수정등의 개발을 수행하는 브랜치입니다.

> 특징2)

- 브랜치가 분기(파생)되는곳 : develop
- merge 되는 곳 : develop & master

- develop 브랜치에 이번 버전에 포함되는 기능이 merge 되었다면, QA 를 위해 develop 브랜치에서부터 release 브랜치를 생성합니다.

- 배포 가능한 상태가 되면 master 브랜치로 merge 시키고, 출시된 master 브랜치에 버전 태그를 추가합니다. 즉, master 브랜치로 merge 이후에는 tag 명령을 통해 버전을 명시해야 합니다.

- release 브랜치에서 기능을 점검하며 발견한 버그 수정 사항은 develop 브랜치에도 적용해 주어야함! 그러므로 배포 완료 후 develop 브랜치에 대해서도 merge 작업을 수행합니다.

> 특징3) merge 할떄 **--no--ff 를 사용하여 기록을 그룹화해야한다.**

feature 브랜치와 마찬가지로 --no --ff 를 사용하여 merge commit 을 생성할 수 있습니다. 생성된 merge commit 을 활용하는 것은 앞서 설명했습니다.

> 특징4) 이름 : release-브랜치명

---

#### 3. hotfix 브랜치

![](https://velog.velcdn.com/images/msung99/post/7d8d7532-7559-4489-87fa-8bd05e44357d/image.png)

> 특징1) Production 에 버그가 발생하면 빠른 수정을 위해 생성하는 브랜치

버그를 잡는 사람이 일하는 동안에도, 즉 한 사람이 Production 코드를 수정하는 중에도 다른 사람들은 develop 브랜치에서 계속 하고있던 개발을 계속할 수 있다는 장점이 있습니다.

> 특징2)

- 브랜치가 분기(파생)되는 곳 : master
- merge 되는 곳 : develop & master

> 특징3) 이름 : hotfix-브랜치명

브랜치명을 짓는 방법은 앞서 살핀 브랜치들을 봤다면 잘 이해되실 겁니다.

> 특징4) master 로 merge한 이후에는 **tag 명령을 통해 이전 버전보다 더 높은 버전임을 명시** 힌디/

예를들어 1.6 -> 1.6.1 과 같이 명시하면 됩니다.

---

## 어떤 Branch 전략을 사용할까?🤔

조직의 규모, 서비스의 특징, 프로젝트에 참여하고 있는 구성원들이 제각기 다르기 때문에, 상황에 따라 사용하기 적합한 전략이 다릅니다.

팀의 브랜칭 전략은 조직의 규모, 서비스 특징등을 고려하고 협의를 진행해서 전략을 결정하는 것이 좋겠습니다.

그래도 일반화를 시켜보자면 아래와 같습니다.

> - Git Flow : Production 의 공식 배포 주기가 길고, QA, 테스트, hotifx 등의 여력이 있다면 Git Flow 가 적절합니다.

---

- GitHub Flow : 지속적으로 테스트 및 배포를 하는 팀의 경우 간단한 GitHub Flow 를 사용하는 것이 좋습니다.

---

- Work-Flow 를 필요 이상으로 복잡하게 만드는 것은 좋지 않습니다.

---

### 출처 & 참고

https://docs.github.com/en/get-started/quickstart/github-flow

https://medium.com/extales/git%EC%9D%84-%EB%8B%A4%EB%A3%A8%EB%8A%94-workflow-gitflow-github-flow-gitlab-flow-849d4e4104d9

https://hellowoori.tistory.com/56

https://dev-jejecrunch.tistory.com/116

https://www.slipp.net/questions/244

https://blog.programster.org/git-workflows
