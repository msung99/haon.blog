---
title: 자바와 템플릿 메소드 패턴(Template Method Pattern)
date: "2023-09-01"
tags:
  - JAVA
  - 디자인패턴
---

## 학습동기

지난번부터 계속해서 우연히 템플릿 메소드 패턴에 대해 알게 되었습니다. 이번에 이 디자인패턴에 대해 자세히 학습해보고, 코드를 깔끔하게 정리하는 방식으로 기존 코드를 개선해보고자 합니다.

---

## 템플릿 메소드 패턴

템플릿 메소드 패턴은 여러 작업들이 완전히 똑같은 로직 및 과정을 거치지만, 극히 일부 코드 및 동작에 대해선 각각 다르게 구현해야할 떄 사용되는 패턴입니다. 즉, **전체적으로는 동일하면서 일부분만 다른 구문으로 메소드를 구성하여 중복 코드를 최소화**할 수 있습니다. 템플릿 메소드 패턴은 아래와 같이 2가지로 나뉩니다.

> 1.  실행 과정을 구현한 상위 클래스 (추상 클래스)
> 2.  실행 과정의 일부 단계를 구현한 하위 클래스(구체 클래스)

상위 클래스는 작업의 전체 흐름을 구현합니다. 즉, 상위 클래스가 흐름 제어의 주최가됩니다. 그리고 각 구현체별로 다르게 구현해야할 일부 동작은 추상 메소드로 따로 정의한 다음, 그 추상 메소드를 호출하는 방식으로 구현하게 도비니다. 하위 클래스는 다르게 동작해야하는 부분, 즉 추상 메소드만 재정의하면 됩니다.

### 템플릿 메소드를 미적용한 경우

간단한 게임을 하나 구현해봅시다. 시작좌표와 끝좌표를 입력받고, 그에 대한 이동 관련 메소드 `move()` 를 정의해줬습니다.

```java
public abstract class PlayGame {
    public abstract void move(int start, int end);
}
```

그러고 PlayGame 에 대한 `move()` 를 구체화할 수 있도록, 2개의 구체 클래스를 정의하고 그 안에 행위를 정의해줬습니다. 2개의 클래스는 `(1)` 과 `(2)` 는 두 구체클래스에서 아예 흐름이 겹치지 않는 별개의 코드입니다.

```java
public class DefaultGame extends PlayGame {
    // ... (생략)
    @Override
    public void move(int start, int end){
        // (1) - 다른 코드내용

        System.out.println("=====================================");
        System.out.println("시작좌표:" + start);
        System.out.println("끝좌표:" + end);
        System.out.println("시작+끝좌표:" + (start+end));
        System.out.println("이동거리:" + Math.abs(end - start));
        System.out.println("=====================================");

        // (2) - 다른 코드내용
    }
}
```

그리고 `(1)` 과 `(2)` 사이의 코드를 보면 알겠지만, 동일한 플로우 및 로직을 가진 중복되는 코드가 발생했습니다. 시작좌표와 끝좌표를 활용하여 다양한 좌표값을 계산하고 출력하는 흐름 및 코드가 모두 동일합니다. 차이점이라 함은, 이동거리를 계산할때 `abs()` 를 활용하는가 아닌가에만 차이가 존재합니다.

```java
public class AbsGame extends PlayGame {
    // ... (생략)
    @Override
    public void move(int start, int end){
        // (1) - 다른 코드내용

        System.out.println("=====================================");
        System.out.println("시작좌표:" + start);
        System.out.println("끝좌표:" + end);
        System.out.println("시작+끝좌표:" + (start+end));
        System.out.println("이동거리:" + (end - start));
        System.out.println("=====================================");

        // (2) - 다른 코드내용
    }
}
```

### 템플릿 메소드 패턴 적용

중복되는 코드를 제거하기 위해, 앞서 설명한 것 처럼 템플릿 메소드를 적용할 수 있습니다. 앞서 설명했듯이 좌표를 계산하는 여러 흐름중 "이동거리" 계산방법에서만 약간의 차이를 보입니다. 이를 감안하고 패턴을 적용하여 중복을 제거해봅시다.

우선 상위 클래스인 `PlayGame` 을 아래와 같이 다시 구현했습니다. 각 구체 클래스에 정의했던 기존 `move()` 들은 플로우가 동일하므로, 재활용성을 높이고 중복을 제거하기 위해 상위 클래스로 이동 및 공통으로 정의해줬습니다. 또한 각각의 세부 동작을 구체 클래스에서 정의해줄 수 있도록, 세부 행위를 `calculate()` 라는 추상 메소드로 추상화해줬습니다.

```java
public abstract class PlayGame {

    public void move(int start, int end){
        System.out.println("=====================================");
        System.out.println("시작좌표:" + start);
        System.out.println("끝좌표:" + end);
        System.out.println("이동거리" + calculate(start, end));
        System.out.println("=====================================");
    }

    protected abstract int calculate(int start, int end);
}
```

세부 동작(행위) 에 대해선 구체 클래스에서 그 행위들을 개별적으로 정의해줬습니다. 앞서 살펴본 각 일부분만 다른 구체적인 동작들이 이렇게 구체 클래스에서 정의되는 것입니다.

```java
public class DefaultGame extends PlayGame {
    // ... (생략)
    @Override
    public int calculate(int start, int end){
        return Math.abs(end -start);
    }
}

public class AbsGame extends PlayGame {
    // ... (생략)

    @Override
    public int calculate(int start, int end){
        return (end -start);
    }
}
```

이로써 전체적으로는 동일한 플로우에서 일부 세부 동작만을 각각 구체 클래스에서 재정의함으로써, 중복 코드가 최소화되는 모습을 확인할 수 있습니다.

---

## 참고

- https://hudi.blog/template-method-pattern/
- https://gmlwjd9405.github.io/2018/07/13/template-method-pattern.html
