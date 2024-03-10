---
title: Git의 4가지 작업 영역 (working, staging, local, remote)
date: "2022-11-18"
tags:
  - git
previewImage: index.png
---

## Repository

Repository란 번역하면 말 그대로 "저장소"를 의미합니다. 깃허브로 협업시 코드를 공유하며 협업을 진행해야하는 경우가 자주 발생할텐데, 이를 위해 따로 공통적으로 관리 및 작업할 수 있는 작업 저장소가 필요할 것입니다.

이때 저장소의 위치에 따라서 "로컬 레포지토리(local Repository)" 와 "원격 저장소(Remote Repository)" 로 구분됩니다.

---

## 로컬 레포지토리 vs 원격 레포지토리

![](https://velog.velcdn.com/images/msung99/post/a98f5ff2-cbd9-4eed-824b-bf010211c659/image.png)

### 로컬 레포지토리(local repository)

우리가 작업하는 내용물들은 모두 각 개인의 로컬 작업환경(컴퓨터)에서 이루어질 것입니다. 당연한 소리죠?

로컬 저장소란 각 개인 PC 에 파일에 저장되는 개인 전용 저장소를 의미합니다.
즉, 평소에 내 PC 에서 작업하는 내용은 곧 로컬 저장소에서 수행되는 것이죠.

- 우리가 로컬에서 작업한 내용을 깃허브 상의 원격 레포지토리에 push 함으로써 팀원들이 해당 remote 레포지토리에서 소스코드를 공유 및 공동작업이 가능해집니다.

### 원격 레포지토리(Remote Repository)

원격 저장소란, "깃허브(GitHub)" 라는 웹 서비스상에 존재하는 저장소로써, 협업시 모든 개발자들이 공동으로 공유하는 저장소를 의미합니다.

즉, 개인 PC 에서 작업한 내용을 타인과 공유 및 공동작업이 필요하다고 느낄때 깃허브의 원격 저장소에 소스코드를 올리는 것이죠.

반대로 원격 저장소에서 다른 사람이 작업한 파일 및 내용을 로컬 저장소로 가져올 수도 있습니다.

---

## Git의 4가지 영역

- Git 의 작업파일은 관점 및 상태(status) 에 따라서 4가지 영역에 위치하게 된다고 할 수 있습니다. 그 영역 4가지는 아래와 같습니다.

> 1. Working Directory (Working Tree)
> 2. Staging Area
> 3. Local Repository
> 4. Remote Repository

![](https://velog.velcdn.com/images/msung99/post/e61e0689-9f2a-4e0c-9ffb-6f00cc8643e2/image.png)

로컬 저장소와 원격 저장소의 개념은 앞서 살펴봐서 무엇인지 아실 것입니다. 그렇다면 로컬 저장소에 작업 내용이 올라가기전의 해당 내용들이 Working Directory 와 Staging Area 에 올라간다는 것인데, 이들이 무엇인지 알아보겠습니다.

### 1. Working Directory (작업 영역)

실제 작업 내용들이 작업이 이루어지는 영역이라고 할 수 있습니다.
즉, 실제 코드를 수정하고 추가하는 변경이 이루어지는 영역입니다.

- 파일 상태는 Untracked file, Tracked file 로 분류됩니다.

### 2. Staging Area

앞선 Wokring Directory 작업한 내용을 Staging Area 로 올려보낼 수 있습니다.

로컬 레포지토리로 정보가 저장되기 전의 준비영역으로써, 현재까지 진행한 작업내용들을 버전화(Version) 를 사켜서 레포지토리에 업로드시키고 싶을 떄, 어떤 파일 및 작업내용들을 묶음으로 묶어서 버전화를 시킬지를 Staging Area 에 올리는 것이라고 보시면 됩니다.

- 파일 상태는 modified, unmodified 로 분류됩니다.

### 3. Local Repository

Staging Area 에서 버전화를 시키도록 했던 작업내용들을 로컬 저장소에 옮긴다면, 이들은 확정적으로 하나의 버전(Version) 을 생성해냅니다.

로컬 저장소에 업로드 됨으로써 생성된 하나의 버전, 즉 히스토리는 "git log" 명령어로 조회할 수 있습니다.

### 4. Remote Repository

로컬에서 생성된 버전은 모두가 공유하기 위한 깃허브의 원격 저장소에 push 할 수 있습니다. 로컬 저장소와 원격 저장소의 개념은 앞서 살펴봤으므로 자세한 내용은 생략하겠습니다.

---

### "Stash" - git 의 숨겨진 영역이 있다?

위 4가지 영역외에도 사실 깃허브는 숨겨진 영역을 하나 보유하고 있습니다. 그것은 바로 "Stash" 영역입니다.

이 영역은 현재 Working Directroy 에서 작업한 파일 및 내용을 일시적으로 가려주고, stash 영역에 잠시 "임시저장" 하는 영역입니다.

이 영역과 관련한 명령어는 아래와 같습니다.

> git stash : 현 작업내용에 대해 임시저장
> git stash pop : 가장 최근에 stash 시킨 작업내용을 복구시킴
> git stash list : stash 시킨 작업내용들을 조회
