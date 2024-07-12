---
title: 자바와 커맨드 패턴(Command Pattern)
date: "2023-09-01"
tags:
  - JAVA
  - 디자인패턴
previewImage: strategy-pattern.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 커맨드 패턴

커맨트 패턴이란 객체의 **"행위(action)"** 를 클래스로 만들어 캡슐화하고, 공통적으로 겹치는 여러 행위들을 인터페이스로 공통화하여 언제든지 행위(클래스) 구현체를 유연하게 갈아끼우고 대응할 수 있도록하는 패턴입니다.

**여기서 "행위(action)" 란 메소드로 정의됩니다.** 보통 다들 개발을 하다보면 어떤 한 묶음의 행위 또는 로직에 대해 "메소드" 를 단위로하여 정의하곤 했을겁니다. 즉, 커맨드 패턴은 공통되는 행위(action) 을 인터페이스로 묶고, 각 세부적인 행위별로 클래스에 세부 행위를 정의해두는 방식입니다.

---

## 커맨드 패턴 구조

커맨트 패턴 구조에서 등장하는 등장인물은 아래와 같이 4가지가 있습니다.

- Client (클라이언트) : 인보커에 커맨드를 세팅하고 커맨드 실행을 위임
- Invoker (인보커) : 커맨드를 실행
- Command (커맨드) : 수행해야 할 작업들을 캡슐화 하여 가지고 있으며, 그 작업들을 실행
- Receiver (리시버) : 수행해야 할 작업

![](https://velog.velcdn.com/images/msung99/post/25acc32b-556b-4a9b-993f-33307dac9591/image.png)

클라이언트에서 실행을 위임받아 여러 작업을 처리하는 객체가 인보커(Invoker) 인데, 인보커가 직접 리시버들을 구성으로 가지고 호출해서 사용하게 되면 인보커와 리시버 사이에 강한 결합이 생기게됩니다. 이렇게 되면 인보커는 구성으로 가지고 있는 리시버의 작업만 행할 수 있으므로 유연성이 떨어지죠.

여기서 커맨드가 중간에 끼어들어 인보커와 리시버의 결합을 끊어버립니다. 커맨트 패턴을 커맨드를 사용해서 의존성을 역전시키고 유연한 구조를 만듭니다. 이전에 설명한 "전략패턴" 의 경우는 커맨드가 없는 구조로, 인보커와 리시버가 서로 강하게 결합되어 있는 형태입니다.

---

## 커맨드 패턴 도식화

![](https://velog.velcdn.com/images/msung99/post/62bdb6e8-3607-4329-9cf8-c6407027ea15/image.png)

간단한 게임을 하나 가정하고, 커맨드 패턴을 적용해봅시다. 사용자의 초기 위치(좌표)는 0 이라고 가정하고, `MoveFront` 라는 앞으로 이동하기 명령어를 전달받은 경우 +2 만큼 이동합니다. 단, 장애물이 존재하는 경우는 앞으로 이동하지 못하고 현좌표 그대로 유지합니다. `MoveBack` 이라는 뒤로 이동하기 명령어를 전달받는 경우는 -1 만큼 이동하며, 장애물과 상관없이 무조건 이동합니다.

### Command 인터페이스 : MoveCommand

`Command` 는 인터페이스로 정의되며, 여러 명령어들에 대한 공통적인 **"행위(action)"** 을 메소드로 선언합니다. 또, 선언된 메소드에 대해 각 구현 클래스에서 자유롭게 구체적인 행위를 정의하면 됩니다. 이 게임의 경우 "이동하기" 가 행위가 되는것이므로 move() 라는 메소드를 선언해줬습니다.

```java
public interface MoveCommand {
    int move();
}
```

### Reviver(리시버) : MoveFront, MoveBack

앞서 말했듯이 구현 클래스, 즉 Command 의 "행위(action)" 에 대한 구체적인 행위를 구체적으로 각 클래스에서 정의해주면 됩니다. MoveFront 와 MoveBack 에서 각각 적절히 "이동하는 행위" 에 대해 정의해주면 됩니다.

```java
// 앞에 장애물이 있으면 움직이지 못한다.
public class MoveFront implements MoveCommand{
    private int currentPosition;
    private final int moveFrontDistance = 2;
    private boolean isObstacle;

    public MoveFront(int currentPosition, boolean isObstacle){
        this.currentPosition = currentPosition;
        this.isObstacle = isObstacle;
    }

    @Override
    public int move() {
        if(isObstacle) {
            return currentPosition;
        }
        return currentPosition + moveFrontDistance;
    }
}



public class MoveBack implements MoveCommand {
    private int currentPosition;
    private final int moveBackDistance = 1;

    public MoveBack(int currentPosition){
        this.currentPosition = currentPosition;
    }

    @Override
    public int move() {
        return currentPosition - moveBackDistance;
    }
}
```

### Invoker : GameController

다음으로 명령어를 전달받고 적절히 게임을 수행할 `인보커(invoker)` 를 정의해줬습니다. 이때 유효성 검증(Validation) 은 이번 핵심 개념에서 벗어나는 내용이므로 생략합니다.

```java
public class GameController {
    public static int playGame(MoveCommand command){
        // validation(command);
        return command.move();
    }
}
```

### Client

마지막으로 인보커를 활용하여, 생성한 여러 명령어들을 전달함으로써 게임이 원활히 수행됩니다.

```java
public class Client {
    public static void main(String[] args){
        int currentPosition = 0;

        // 첫번째 게임(이동) 시도
        MoveCommand command1 = new MoveFront(currentPosition, true);
        currentPosition = GameController.playGame(command1);

        // 두번째 액션(게임) 시도
        MoveCommand command2 = new MoveBack(currentPosition);
        currentPosition = GameController.playGame(command2);

        // 세번째 액션(게임) 시도
        MoveCommand command3 = new MoveFront(currentPosition, false);
        currentPosition = GameController.playGame(command3);

        System.out.println("최종좌표:"  + currentPosition); // 최종좌표:1
    }
}
```

### 명령어의 확장

만약에 명령어 타입을 더 추가하여, 맨 마지막 좌표로 이동하고 싶은 경우는 어떻게할까요? 종점이 좌표값이 100이라고 가정한다면, 아래처럼 Command 인터페이스를 상속받는 명령어 구체 클래스 타입을 새롭게 정의해주면 될 것입니다.

```java
public class MoveToEndPoints implements MoveCommand{
    @Override
    public int move() {
        return 100;
    }
}
```

---

## 커맨드 패턴과 전략 패턴의 차이점

지난 [전략 패턴(Strategy Pattern)](https://velog.io/@msung99/%EC%A0%84%EB%9E%B5-%ED%8C%A8%ED%84%B4Strategy-Pattern-%EC%9C%BC%EB%A1%9C-%EC%BD%94%EB%93%9C%EC%9D%98-%ED%99%95%EC%9E%A5%EC%84%B1%EC%9D%84-%EA%B3%A0%EB%A0%A4%ED%95%B4%EB%B3%B4%EC%9E%90) 에 이어서 이번 커맨드 패턴을 학습하면서 차이점이 잘 구분되지 않아서 많이 햇갈려했습니다. 다행히도 [스택오버플로우](https://stackoverflow.com/questions/4834979/difference-between-strategy-pattern-and-command-pattern) 를 보고서 이에 대한 궁금증이 다소 해결되었습니다.

결론부터 말하자면 **전략 패턴은 "주어진 입력 및 조건이 동일한 환경" 일때의 알고리즘에 대한 확장성을 고려했다면, "커맨트 패턴은 "액션(Action)", 즉 행위에 대해 확장성을 고려한 것입니다.**

"최단경로 구하기" 라는 상황이 주어졌다고 가정해봅시다. 이때 좌표값 x,y 가 주어졌을때, x 에서 y 라는 최단경로를 구해야하는 상황이 주어졌으며, 이를 어떤 알고리즘, 즉 해결법으로 해결하는가에 대한것이 "전략패턴" 입니다. 이 경우는 "경로 구하기" 가 인터페이스라면, 그에 대한 구현체가 다익스트라 알고리즘, 브루트포스 알고리즘등의 다양한 전략이 해당될 것입니다.

반면 "커맨드 패턴" 에서 바라봤을때는, 좌표 x, y 에 대한것은 중요치 않습니다. 오로지 "최단 경로를 구한다" 라는 행위 그 자체에만 관점이 맞춰져 있기 때문에, x, y 값이 주어지던말던, 또는 그 외에 기타 파라미터들이 주어지는 것과 별개로 "최단 경로를 구할 수 있다" 라는 행위가 잘 동작하면 됩니다.

이런 이유로 전략패턴은 해당 메소드의 파라미터에 강하게 결합되어있고, 영향을 받습니다. 반면 커맨드패턴은 파라미터와 무관하게 오로지 행위에만 초점이 맞춰져 있으므로, 메소드의 파라미터와 무관하게 동작해야 합니다. 만약 커맨트 패턴으로 설계했는데 파라미터로 인해 제약되는 사항이 있다면 잘못 설계되었을 가능성이 매우 큽니다.

---

## 참고

- https://tecoble.techcourse.co.kr/post/2021-10-04-strategy-command-pattern/
- https://tinkerbellbass.tistory.com/74
- https://lodado.tistory.com/42
- https://victorydntmd.tistory.com/295
- https://stackoverflow.com/questions/4834979/difference-between-strategy-pattern-and-command-pattern
- https://blog.hongo.app/chess-command/
- https://kotlinworld.com/370?category=1018782
