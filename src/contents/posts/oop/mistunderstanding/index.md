---
title: "객체지향을 아는척 하지 말자 - 오해하고 있었던 객체지향의 정체에 대해"
description: 객체지향에 대해 알아보자.
date: "2023-01-21"
tags:
  - 객체지향
  - OOP
  - 디자인패턴
previewImage: oop.png
---

## 시작에 앞서

> 혼자서 공부하며 작성한 것이므로,잘못 이해한 내용을 적었을 가능성이 충분히 있습니다 😆

객체지향이 왜 중요하고, 어떻게 활용된다는건지 아직도 전혀 모릅니다. 따라서 포스트 내용이 매우 추상적이고, 부실할 수 있습니다 😓

구글링을 하다가 우연히 **객체지향이 무엇인지 처음으로 이론을 얇게나마 접하게 되었습니다.** **혼자서 인터넷에 떠돌아다니는 다른 블로그들을 참고하며 뭔지 간단히나마 이론만을 접한 것 이므로 설명이 많이 부실합니다.**

**프로젝트, 개발에 이 객체지향 이라는게 어떻게 활용되는지도 전혀 모릅니다.** 또한 인터넷의 자료를 읽다가 이해를 못한 내용들이 많습니다. 따라서 혹시 이 글을 읽으시는 분들이 있다면, 적은 내용이 틀릴 가능성이 충분히 있음을 감안하시는걸 미리 알려드립니다 🙏

### 학습배경

학습을 시작한 계기가 부끄럽지만, 인터넷을 찾아보며 공부할때 "객체지향" 이라는 개념이 중요하다! 잘 활용해야한다! 라는 말들을 간혹 봤습니다. **객체지향이 아직도 무엇인지 잘 모르겠지만, 일단 "기초" 개념을 공부하며 들었던 제 생각을 조금이라도 기록해보고자 합니다.**

따라서 지금부터 포스트에 작성할 내용이 절대 정답이라고 할 수 없습니다. 하지만 제가 최근에 혼자 공부해봤던 개념에 대해 얇게라도 정리하며, 혹시 이 글을 읽는 분들에게도 제 생각을 공유하고자 합니다 😁

---

## 1. 객체지향은 현실세계를 일반화 한 것이 아니다

### 우리는 현실세계에 존재하는 것을 일반화시키고 있었다..!

이론적인 접근방식으로 설게한다면, 매번 잘못된, 편합된 사고를 가지고 이상한 접근방식을 가질 수 있게됩니다. 그 중 하나가 **현실세계에 존재하는 물체를 일반화시켜서 프로그래밍에 적용하는 것**입니다.

예를들어 기존의 저희는 아래와 같은 접근방식으로 일반화시켜서 프로그래밍을 진행해왔습니다.

- 클래스는 와플기계이고, 와플은 객체(오브젝트)이다.
- Car 클래스의 멤버변수로는 speed, name 등이있다.

심지어 위 내용들은 유명한 출판사 책들에서도 이론적으로 설명하는 내용들입니다. 저희는 이런식으로 접근하지 말자는 것이죠. 객체지향의 세계는 현실세계와 다른 방식으로 접근해야 합니다.

### 객체끼리는 살아숨쉬며, 상호간에 "협력"하는 사이이다.

어떻게 현실세계와 다른지 예시를 통해 알아봅시다.

![](https://velog.velcdn.com/images/msung99/post/95b7225b-c22b-49ce-affa-319f15835b68/image.png)

현실세계에서 본인이 자동차를 엑셀을 밟는 상황을 가정해보자. 현실세계에서는 그냥 엑셀을 밟으면 자동차가 속도가 증가해서 앞으로 나가는 상황으로 당연히 받아들여질겁니다. 사람인 내가 자동차에게 엑셀을 밟는 명령, 즉 행위를 시도하면 자동차는 그저 앞으로 나가는 물체에 불과하죠.

![](https://velog.velcdn.com/images/msung99/post/653bace8-97e7-41c2-bc42-71d33e587966/image.png)

그러나 객체지향 세계에서는 아닙니다. **자동차는 엄연히 "살아숨쉬고 있는, 마치 인격이라도 가지고 있는것처럼 보이는 객체" 로 바라보아야 합니다.** 객체지향의 세계에서는 본인(사람)도 객체이고, 자동차도 객체입니다. 따라서 사람은 엑셀을 밟아서 속도를 증가시키고 싶다면, 자동차에게 속도를 증가시키겠다는 요청을 보내야합니다.

요청을 받은 자동차는 자율적으로 본인의 의사에따라 속도를 증가시킬지말지는 결정할 수 있는 주체입니다. 따라서 요청을 거부할 수도있고, 반대로 승인할 수도 있는것이에요!

> 객체는 또 다른 객체를 엄연한 객체로 바라보고, 상호간에 요청과 응답을 주고받으면서 협력해야 하는 사이입니다.

---

## 2. 역할과 구현을 구분짓자

또 **객체간의 협력시 역할과 구현을 구분할 수 있어야합니다.** 책임이라는 키워드를 앞서 알게 되었는데, 역할과 구현은 또 도대체 뭘까요?

### 역할과 구현은 어떻게 다른가?

![](https://velog.velcdn.com/images/msung99/post/fcfc85f5-2d00-4868-913e-8da9d8892b3c/image.png)

앞선 예제에서, 사람과 자동차만 따로 생각해봅시다. 주유소는 따로 굳이 설명에 포함하지 않아도 충분히 설명가능하기 때문입니다.

만일 사람과 자동차 객체와의 협력 관계에서, 자동차 객체는 엄밀히 따졌을때 다양한 차종으로 구분될 수 있겠죠? 당연한 말이지만 소나타, 스태랙스, 캠핑카와 같은 여러 차종들이 자동차에 해당하는 것입니다.

그런데 여기서, 사람이 선택한 차종이 소나타였는데 스타랙스로 바뀐다고 한들, 전체적인 서비스 흐름에 영향을 끼칠까요? 그건 아닐겁니다. 앞선 예시에서 사람과 자동차에게 부여된 책임들을 다시 살펴본다면, 소나타가 스타랙스로 바뀐다고해서 엑셀을 밟았을때 속도가 증가하는것이 아닌, 엉뚱하게 반대로 속도가 감소해서 후진하는 경우는 없을겁니다.

정리해보자면, **여러 자동차들은 하나의 동일한 역할(=책임의 집합)을 수행하는 자동차로 구분될 것입니다.** 각각의 자동차들을 저희는 구현이라고 부루는 것이며, "자동차" 라는 것은 역할로 부르는 것입니다.

조금 더 생각해보면, 아래와 같은 관점을 생각해낼 수 있습니다.

> - 책임들은 모여 하나의 역할을 구성한다.

- 하나의 역할은 다양한 구현을 그 아래로 가질 수 있다.
- 각 객체들은 구현이 아닌 역할을 중점으로 상호작용하는 것이 좋다.

### 왜 구현이 아닌 역할을 중점으로 상호작용해야할까?

만일 역할이 아닌 구현을 중점으로 객체간에 상호작용한다고 해봅시다. 그러면 자동차가 아닌 소나타로 소통한다고 해보는것이 되겠죠?

이러면 갑자기 서비스를 개발할떄, 다른 차종으로 급하게 바꿔서 개발을 진행해야한다고 해봅시다. 소타나에서 갑자기 스타랙스로 갈아끼워야 하느 상황인거죠. 그렇다면 저희는 자동차가 아닌 소나타라는 구현, 즉 구체화에 의존해있기 때문에 개발 코드를 일일이 새롭게 구현해주고 서비스 설계를 다시 진행해야 할겁니다.

반대로 자동차라는 추상화, 즉 역할을 중점으로 개발했다면 스타랙스로 바뀌더라도 서비스 설계 자체에 거의 지장이 없을겁니다. 이 때문에 구현이 아닌, 역할을 중점으로 상호작용 해야한다고 합니다.

> - 구현을 중점으로 객체간에 소통하면, 유연성이 떨어진다.

- 역할을 중점으로 설계하면서, 언제든지 다른 구현 객체로 바뀌더라도 문제가 없도록 설계해야한다.

---

## 3.객체는 자율적인 존재이다

![](https://velog.velcdn.com/images/msung99/post/45c6d3c1-b674-4acf-9106-5c9d59378dbb/image.png)

다음으로 저희는 **객체를 자율적인 존재로 인식해야 한다**는 것입니다.

> 객체는 그 본인의 역할만 제대로 수행할 수 있다면 어떤식으로 구현돠어도 무관하다는 것입니다.

즉, 자동차라는 역할을 문제없이 수행하고, 타 객체와의 협력에서 문제가 없다면 소나타로 구현되던, 스타랙스로 구현되던 상관이없다는 것이죠. 그리고 소나타로 구현이 되었을때, 엑셀 기능만 잘 동작하도록 역할만 수행한다면 문제가 없으니까 소나타 내부 엔진이 어떻게 구체적으론 구현되던간에 상관이 없다는것입니다.

---

## 4. 행동이 상태를 결정

![](https://velog.velcdn.com/images/msung99/post/94ae3dd4-bbe8-4eb9-a8c1-019cfc47b2cd/image.png)

그리고 **행동이 상태를 결정한다** 라는 것을 인지하고 접근하는 사고방식이 객체지향적인 접근입니다.

객체지향적인 설계를 고려하지않은 경우를 가정해봅시다.
만일 Car 클래스를 설게할때 다른 객체들과의 협력관계를 생각하지 않았다면, 무의적으로 어떤 필드가 들어가겠지? 라는 추측을 가지고 설계할겁니다.
getter, setter 가 필요할것같고, 자동차이니까 speed, oil_gage 필드도 필요할 것같아서 마주잡이로 설계하는겁니다.

이 방식은 잘못된, 객체지향을 무시하는 접근입니다. 이 자동차 클래스가 어떻게 서비스가 영향을 미칠줄 알고 설계를 마주잡이로 정의하는 것일까요?

> 자동차 객체가 또 다른 어떤 객체와 어떤 상호작용을 할지가 정해지고, 역할이 정확히 정해진 후에 그것을 토대로, 상태, 필드, 속성등을 결정하는 것이 올바른 객체지향 접근방식이라고 하네요!

---

## 마치며 - 객체지향이 왜 중요하고, 어떻게 활용하는건데?

객체지향이 왜 중요하냐구요? 언제 어떻게 활용하냐구요?
**솔직히 말하자면, 모르겠습니다..! 🥹 (?ㅋㅋ)** 일단 구글링으로 혼자서 얇게나마 공부해보면서, 일단 최대한 간단한 이론이라도 이해해보는데 취지를 두고 글을 작성해봤습니다 😅

**부끄럽지만 객제지향이라는게 어디서 어떻게 활용할 수 있는건지 모르고, 왜 중요하다는건지 모르겠습니다.** 이에관해 열심히 학습을 해봐야할 것 같습니다. (막막하네요 어떻게 학습할지..!)

아무튼 간에!! 이렇게 포스트를 마쳐보겠습니다. 혹시 이 글을 읽으실분이 있을진 모르겠지만, 저처럼 객체지향이 무엇인지 궁금하여 기초 개념을 학습하는 모든 분들에게 이 포스팅이 도움이 되었으면 하는 바람입니다!! 😆
