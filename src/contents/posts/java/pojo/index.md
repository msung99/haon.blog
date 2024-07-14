---
title: POJO (Plain Old Java Object) 를 왜 지향해야 하는가?
date: "2024-07-15"
tags:
  - Java
previewImage: java.png
---

## POJO

`POJO(Plain Old Java Object)` 란 말 그대로 오랜된 방식의 간단한 자바 객체를 뜻한다. 자세히는 특정 기술에 종속되어 있지 않은 상태의 객체를 말한다. 필드에 getter, setter 와 같은 정말 기본 기능만을 갖는 기본 객체가 바로 POJO 를 만족하는 객체에 해당한다. 

## POJO 는 왜 등장했는가?

POJO 가 왜 등장했는지를 이해하면, POJO 를 왜 지향해야하는지 이해할 수 있다. 이를 위해 등장배경을 살펴보자.  2000년 9월에 마틴 파울러, 레바카 파슨, 조시 맥킨지등이 사용하기 시작한 용어로써, 마틴 파울러는 다음과 같이 그 기원을 밝히고 있다.

> 우리는 사람들이 자기네 시스템에 보통의 객체를 사용하는 것을 왜 그렇게 반대하는지 궁금하였는데, 간단한 객체는 폼 나는 명칭이 없기 때문에 그랬던 것이라고 결론지었다. 그래서 적당한 이름을 하나 만들어 붙였더니, 아 글쎄, 다들 좋아하더라고. - 마틴 파울러 -

당시 Java EE 등의 중량 프레임워크를 사용하게 되면서 해당 프레임워크에 종속된 무거운 객체를 만들게 된 것에 반발해서 사용하게 된 용어다. 2000년 초반 당시 IT 기술이 발전하면서, 다양한 기술, 서비스가 점차 등장하게 된 시기였다. 하지만 문제점은, 생산성 그 자체에 집중하다보니 객체지향적인 설계를 포기하고 특정 기술에 의존하여 급급하게 개발하는 방식이 늘어났다. 이는 결과적으로 유연한 확장성을 낮추는, 유지보수가 어렵게 만드는 문제를 야기했다.

이를 해결하기 위해 `POJO` 라는 개념이 등장했다. 본래 자바의 장점을 살리는 `오래된` 방식의 `순수한` 자바 객체의 중요성이 필요하여 등장했다. POJO 를 다시 정의하자면, **자바 언어의 규약에 의한 제한사항 외의 그 어떠한 제한사항에도 구속받지 않는 (의존성을 최소화한) 자바 객체를 뜻한다.**

## POJO 프로그래밍 규칙

POJO 프로그래밍이란 POJO 객체를 만들기 위한 프로그래밍 설계 기법이다. 즉, 객체지향적인 원리에 충실하면서 특정 환경과 기술에 종속되지 않고, 필요에 따라 재활용될 수 있는 방식으로 설계된 오브젝트를 개발하는 방식이다. 이 프로그래밍 규칙을 준수하기 위해선, 애플리케이션의 핵심 로직과 기능을 담아 설계하고, 개발해야한다.

더 자세히 들어가, POJO 프로그래밍 규약에는 어떠한 것들이 존재할까? 

>  1. JAVA 스팩외에 다른 기술이나 규약에 종속되지 않아야 한다. (미리 지정된 특정 기술, 클래스, 인터페이스등을 extend/implement 해선 안된다.)
>  2. 객체지향적인 설계를 해야한다.

아래 코드는 `getter` 와 `setter` 만 가지고 있는 코드다. 이는 자바에서 제공하는 순수 기능만을 사용하므로, 즉 자바 언어 이외의 특정 기술에 종속되어 있지 않은 순수한 객체다. 따라서 POJO 라고 부를 수 있다.

~~~java
public class User {
    private String id;
    private String password;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
~~~

반대로 아래는 POJO 라고 부르기 힘든 경우다. 즉, 특정 기술에 종속적인 코드다. `ActionForm` 클래스는 과거 Status 라는 웹 프레임워크에서 지원하는 클래스다. 이 클래스에서 제공하는 기능을 사용하기위해 `extend` 로 상속받고 있다. 이런 방식으로 특정 기술을 상속받게 되면, 애플리케이션 요구사항에 따라 다른 기술로 변경해야 하는 상황이 오면 Status 클래스를 활용한 코드를 모두 변경해야하기 때문에, 객체지향적인 설계라고 보기 힘들다. 

~~~java
public class MessageForm extends ActionForm {
    String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

public class MessageAction extends Action {
    public ActionForward execute(ActionMapping mapping, ActionForm form,
        HttpServletRequest request, HttpServletResponse response)
        throws Exception {

        MessageForm messageForm = (MessageForm) form;
        messageForm .setMessage("Hello World");

        return mapping.findForward("success");
    }
}
~~~

결론적으로 JAVA 외의 다른 기술에 얽매이지 않고, 종속적이지 않으며, 특정 환경에 의존하지 않도록 해야 POJO 프로그래밍이라고 할 수 있다.

### 진정한 POJO 란 

그렇다면 위 규약을 모두 지킨 객체는 '진정한 의미의' POJO 라고 할 수 있을까? 토비의 스프링에서는 진정한 POJO에 대하여 아래와 같이 이야기 한다.

> 💡 진정한 POJO란 객체지향적인 원리에 충실하면서, 환경과 기술에 종속되지 않고 필요에 따라 재활용될 수 있는 방식으로 설계된 오브젝트를 말한다.

토비님은 왜 이런 머리 아픈 이슈를 마지막에 던진것일까?자바가 객체지향적 설계의 장점을 포기하고 특정 기술과 환경을 사용하기에 급급했던 예전 시절의 고통을 잊지말자는 교훈을 던진것이 아닐까? 🙂


## POJO 프로그래밍으로 어떤 이점을 제공받는가?

- 특정 환경이나 기술에 종속적이지 않으면 재사용이 가능하고, 유지보수 및 확장 가능한 코드를 작성할 수 있다.
- 비즈니스 로직과 특정 환경 종속적인 코드를 분리하기 때문에 코드가 단순해진다.
- 특정 환경에 종속적인 로직이 포함된 객체는 테스트가 어렵다. 하지만 POJO 는 테스트가 단순하고 쉽다.
- 객체지향적인 설계를 제한없이 적용할 수 있다.

## 스프링 프레임워크는 어떻게 POJO 를 제공하는가?

이번에 POJO 를 학습하면서 새롭게 꺠달은 사실인데, 스프링 프레임워크는 POJO 프로그래밍 또한 유지하면서 여러 기술에 종속적이지 않도록 개발된 유연한 프레임워크라는 것을 세삼 알게 되었다.

스프링 프레잌워크 등장 이전에는 원하는 기술이 있다면 그 기술을 직접 사용하는 객체를 설계해야했다. 그리고 이는 특정 기술과 환경에 의존하게 되는 문제로 이어졌고, 자바에서 제공하는 객체지향 설계의 이점들을 잃어버리게 되었다.

그래서 POJO 라는 개념이 등장하게 된 것이다. 본디 자바의 객체지향이라는 장점을 살리기 위함이다. 보통 스프링 프레임워크를 사용할 때 `ORM` 이라는 기술을 사용하기 위해 `Hibernate` 를 프레임워크 기술을 사용한다. 하지만 Hibernate 라는 기술을 직접 사용하면 앞서 말했듯이 특정 기술에 종속적인 문제가 발생한다. 따라서 Hibernate 를 비롯한 여러 ORM 프레임워크들은 `JPA` 표준 인터페이스 아래에서 동작한다. 즉, Hibernate 를 비롯한 여러 ORM 프레임워크들은 이 JPA 라는 표준 인터페이스 아래에서 구현되고 실행된다. 따라서 프로그래머는 JPA 라는 표준 인터페이스 만으로 프로그래밍하고, Hibernate 를 비롯한 특정 ORM 기술에 직접 의존하지 않고 유연한 프로그래밍이 가능하다. 

## 더 학습해 볼 키워드

- Java Bean 과 POJO 의 차이점

## 참고

- https://siyoon210.tistory.com/120
- https://ittrue.tistory.com/211
- https://wooj-coding-fordeveloper.tistory.com/80