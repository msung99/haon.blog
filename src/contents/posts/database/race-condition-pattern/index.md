---
title: 경쟁 상태의 2가지 패턴 - Read-Modify-Write, Check-Then-Act
date: "2024-09-19"
tags:
  - Spring
  - 테스트
  - 하온
previewImage: database.png
---

## 경쟁상태(Race Condition)

스프링부트 애플리케이션은 멀티 쓰레드로 동작한다. 멀티 쓰레드 환경에서 안전하게 다루어야 할 요소 중 하나는 바로 동시성 이슈이다. 동시성 이슈는 여러 쓰레드가 함께 다루는 데이터, 즉 공유 자원에 대해 발생한다. 이렇듯 **공유 자원에 여러 쓰레드가 동시간대에 접근함으로인해 데이터 정합성 이슈가 발생할 수 있는 상황을 경쟁 상태(Race Condition) 이라고 한다.** 이번 포스팅에선 경쟁 상태가 발생하는 전형적인 패턴 2가지인 **Read-Modify-Write**, **Check-Then-Act** 에 대해 학습해보도록 한다.

## Read-Modify-Write 

Read-Modify-Write 패턴이란 **이전 상태를 기준으로 객체의 현재 상태를 변경하면서 발생하는 문제**를 뜻한다. 코드로 이해해보자. 

### 아이템 관리 서비스

아이템을 관리하는 서비스를 가정해보자. 컬렉션으로 아이템을 관리하며, 아이템 잔량을 관리하기 위한 간단히 `count` 변수를 만들었다. `addItem()` 을 호출하면 신규 아이템이 아이템 리스트에 추가되고, count 값이 1증가할 것이다. 여기서 count 변수는 여러 쓰레드가 동시에 접근 가능한 공유자원임을 알고 넘어가자. 

~~~java
public class ItemManager {
    private List<Item> items = new ArrayList();
    private int count;

    public void addItem(Item item) {
        items.add(item);
        count++;
    }

    public List<Item> getItems() {
        return items;
    }

    public int getCount() {
        return count;
    }
}
~~~

이제 동시간대에 100명의 쓰레드가 아이템을 추가하기 위해 `addItem()` 을 호출한다고 해보자. 

~~~java
@Test
void 쓰레드_100개가_동시에_아이템을_추가한다() throws Exception {
    ItemManager itemManager = new ItemManager();

    Runnable runnable = () -> {
        for(int i=0; i<100; i++) {
            itemManager.add(new Item("신규 아이템"));
        }
    };

    for(int i=0; i<100; i++) {
        (new Thread(runnable)).start();
    }

    Thread.sleep(100000);

    System.out.println(itemManager.getCount());
}
~~~
 
위 코드가 실행되면 count 변수 결과값은 얼마일까? 단순하게 생각해본다면 100개의 쓰레드가 100번의 +1 연산을 수행하니, 결과값은 10000이 될 것으로 예상된다. 하지만, 실제 결과값은 기대와 달리 10000이 되지 못한다.

사실, 공유자원인 count 에 대한 `count++` 연산 내부 동작은 아래와 같은 세부 동작이 발생한다.

- `(1)` count 변수의 현재 값을 가져온다.
- `(2)` 값을 수정한다. (값을 1증가시킨다)
- `(3)` 수정한 값을 실제로 반영한다 (덮어씌운다)

쓰레드1과 쓰레드2가 있고, 현재 count 값은 100 이라고 가정해보자. 만약 쓰레드1이 `(3)` 번 까지의 과정 수행을 마치기 전에 쓰레드2 가 count 값을 읽어오면 어떻게 될까? 쓰레드 1이 아직 +1 증가시킨 연산을 아직 실제로 반영하지 못했기 떄문에, 쓰레드2는 반영하기 이전의 기존 값인 100을 읽어오게 된다. 결국 count 의 결과값은 102가 아닌 101이 되어서, 예기치못하게 데이터 정합성 이슈가 발생한다. 이는 `원자성(atomic)` 을 보장하지 못한 결과이다.

이와 같이 **이전 상태를 기준으로 객체의 현재 상태를 변경하면서 발생하는 데이터 정합성 문제** 를 **Read-Modify-Write** 패턴이라고 한다.

## Check-Then-Act 패턴

Check-Then-Act 패턴은 **이전에 검증(Check) 한 결과가 행동(Act) 을 취햐는 시점에는 더 이상 유효하지 않을 때 발생하는 문제**를 뜻환다. 쉽게말해, **if 조건문(Check) 를 통과하기 이전에는 조건에 부합하는 값이었지만, if 문을 통과한 이후에는 조건에 부합하지 않음으로 인해 데이터 정합성 문제**가 발생하는 경우를 의미한다.

### 수강신청 관리 서비스

이번에는 수강신청 관리 서비스를 가정해보자. 최대 100명의 수강신청 인원을 수용할 수 있으며, 한 사람의 수강신청 정보는 `Register` 타입으로 관리된다. 또한 현재까지 수강신청한 인원을 관리하기 위해 `count` 변수를 선언했다. 앞선 예제와 다르게 `count` 값을 최대 100까지 만들 수 있다는점을 인지하자.

~~~java
public class RegisterManager {
    private static final int REGISTER_LIMIT = 100;
    private List<Register> registers = new ArrayList();
    private int count;

    public void addRegister(Register register) {
        if(count < REGISTER_LIMIT) {
            registers.add(register);
            count++;
        }
    }

    public List<Register> getRegisters() {
        return registers;
    }

    public int getCount() {
        return count;
    }
}
~~~

만약 100개의 쓰레드로 `addRegister()` 를 호출한다면 어떻게 될까? 이번에는 과연 `count` 값이 100을 초과하지 않고 문제없이 실행될까? 아쉽게도, count 값은 최대 허용범위인 100을 훌쩍 초과하는 값이된다. `if(count < 100)` 으로 검증한 결과가 `count++` 을 실행하는 시점엔 더 이상 유효하지 않기 떄문에 발생한 문제이다. 

현재 `count` 값이 100 이고, 현재 쓰레드1 에서 아직 `count++` 을 수행한 결과를 반영하지 못했는데, 그 사이에 다른 여러 쓰레드2,3,4들에서 `if(count < 100)` 조건을 검증하면 어떻게 될까? 신기하게도 조건문을 모두 통과해버리게 되고, 결국 수행되선 안될 count++ 이 여러번 수행된다. 

## 참고

- https://www.youtube.com/watch?v=ktWcieiNzKs
