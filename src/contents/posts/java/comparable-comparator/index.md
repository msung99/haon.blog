---
title: 자바의 Comparator 과 Comparable 인터페이스
date: "2024-08-30"
tags:
  - JAVA
  - Comparator
  - Comparable
---

## 학습배경

`Comparable` , `Comparator` 에 대한 사용법을 잘 몰라서, 이번 기회에 제대로 학습해보고자 합니다.

---

## Comparator 와 Comparable

### 공통점

결론부터 말하자면, 둘의 공통점은 **사용자 정의 클래스의 객체들을 비교할 수 있게 해주며**, 위 인터페이스들을 구현한 사용자 정의 클래스의 객체들을 정렬하고 싶을때 임의의 정렬기준을 쉽게 정의할 수 있도록 도와주는 역할을 수행합니다.

자바 차원에서 제공해주는 일반 클래스(ex. Integer) 들과 달리, 사용자가 직접 정의한 클래스들의 객체들을 정렬하고 싶어도 명확한 정렬기준이 없습니다. 이때 Comparator 와 Comparable 를 활용한다면 해당 클래스들에 대한 정렬기준을 손쉽게 정의 할 수 있으며, `Collections.sort()` 와 같은 메소드를 호출했을 때 정의한 "정렬기준" 에 따라서 정렬된 결과가 나오게 됩니다.

### 차이점

둘의 차이점은 "비교대상" 에 있습니다. `Comparator` 의 경우 두 매개변수 객체를 비교하는 것이고, `Comparable` 는 자기 자신과 매개변수 객체를 비교하는 것입니다.

```java
// Comparator, Comparable 실제 구현코드
public interface Comparable<T> {
  public int compareTo(T o);
}

public interface Comparator<T> {
  int compare(T o1, To2);
  // ...
}
```

이 점들을 핵심 포인트로 생각하면서, 지금부터 두 인터페이스들의 개념에 대해 자세히 알아봅시다.

---

## Comparable

Comparable 은 사용자 정의 클래스의 객체들이 임의의 기준으로 정렬될 수 있도록 만들고 싶을때 활용합니다. **자기 자신과 매개변수 객체를 비교하는 방식** 으로 정렬기준이 생성됩니다. 또 "정렬기준" 은 `compareTo()` 를 직접 오버라이딩 하여 개발자가 직접 정의해주면 됩니다.

### compareTo

Comparable 인터페이스를 구현하는 클래스는 `compareTo(T o)` 메소드를 오버라이딩 해야합니다. `compareTo(T o)` 는 파라미터로 객체를 전달받으며, 정렬 기준은 오름차순입니다. 정렬기준은 반환값에 따라 달라집니다.

> - 현재 객체가 파라미터로 받아온 객체보다 우선순위가 높다면 : 양수 반환

- 현재 객체가 파라미터로 받아온 객체보다 우선순위가 높다면 : 음수 반환
- 둘의 우선순위가 같다면 : 0 반환

예를 들어봅시다. 우선 사용자 정의 클래스 Student 가 아래와 같이 정의되었다고 해봅시다.

```java
class Student {
  private String name;
  private int score;

  public Student(Stinrg name, int score){
    this.name = name;
    this.score = score;
  }
}
```

그러고 ArrayList 를 활용하여 더미데이터를 넣어주고, 아래처럼 `Collections.sort()` 를 통해 정렬을 시도해보면 에러가 발생합니다.

```java
ArrayList<Student> students = new ArrayList<>();
students.add(new Student("홍길동"), 60);
students.add(new Student("이하온"), 80);
students.add(new Student("김철수"), 40);

students.stream()
		 .sorted()
	     .collect(Collectors.toList())
         .forEach(System.out::println);
```

이는 왜 에러가 발생할까요? 그 이유는 "정렬기준" 을 알 수 없기 때문입니다. 때문에 객체를 비교할 수 있도록 Comparator 과 Comparable 를 인터페이스로 사용하여 저희가 직접 "사용자 정의 클래스 객체들의 정렬기준" 을 `compareTo()` 를 오버라이딩하여 구현해줘야 합니다.

```java
public class Student implements Comparable<Student>{
    private String name;
    private int score;

    public Student(String name, int score){
        this.name = name;
        this.score = score;
    }

    @Override
    public int compareTo(Student ohter) {
        return this.score - this.other;
        // return this.other - this.score;
    }

    // ...
}
```

위에서 보듯이 compareTo( ) 를 오버라이딩하여 정수형 반환값을 리턴하도록 했습니다. 이때 compareTo 의 경우는 개발자가 원하는 다양한 방식대로 구현이 가능할겁니다. 예를들어 위 정렬기준 코드를 아래처럼도 정의 가능합니다.

```java
@Override
public int compareTo(Student other) {
  if(this.score > other.score) {
    return 1;
  }

  if(this.score < other.score) {
    return -1;
  }

  return 0;
}
```

이렇게 정의도 가능하지만, 위 Student 클래스의 경우는 if문으로 굳이 분기처리를 복잡하게 구성하지 않고도 정렬이 가능하기 떄문에, 첫번째 방식이 더 좋을겁니다. 이런 구현 방법은 상황에 따라 적절히 구현해주면 됩니다.

---

## Comparator

`Comparable` 은 객체 자신이 정렬 가능하도록 구현하는데 목적이 있다면, `Comparator` 는 타입이 같은 객체 2개를 매개변수로 전달받아 우선순위를 비교할 수 있는 정렬기준을 만드는데에 차이가 있습니다. 마치 제 3자가 두 객체를 비교하고 정렬해주는 느낌이라고 보면 됩니다.

### compare

앞서 살펴본 `Comparable` 는 `compareTo(T o)` 가 인자를 1개만 받고 자기자신과 비교하면 됐다면, `Comparator` 의 `compare(T o1, T o2)` 는 비교할 2개의 객체를 인자로 받고 정렬기준을 정의해줘야 합니다. 반환값은 아래 기준을 따릅니다.

> - o1 이 o2 보다 우선순위가 높다면 : 양수 반환

- o1 이 o2 보다 우선순위가 낮다면 : 음수 반환
- 둘의 우선순위가 같다면 : 0 반환

아래처럼 Comparator 를 구현하는 클래스를 별도로 생성해주면 됩니다. Comparable 과 마찬가지로 비교 대상의 타입을 제네릭으로 전달하면 됩니다.

```java
public class StudentComparator implements Comparator<Student> {
    @Override
    public int compare(Student s1, Student s2){
        return s1.getScore() - s2.getScore();
    }
}
```

`Collections.sort()` 로 정렬시, 두 객체를 정렬해줄 제 3자로 Comparator 구현 클래스 객체를 함께 인자로 넘겨주면 정렬이 수행됩니다.

```java
List<Student> students = new ArrayList<>();
students.add(new Student("김철수", 60));
students.add(new Student("나영희", 80));
students.add(new Student("다람쥐", 40));

Collections.sort(students, new StudentComparator());
```

---

## Comparator 주요 메소드

Comparator 는 Comparable 과 달리 다양한 메소드 기능들을 여럿 제공합니다. 그 중 자주 쓰이는 주요 메소드들을 추가적으로 살펴봅시다.

### reversed

정렬 규칙의 반대로 정렬합니다.

```java
Collections.sort(students, new StudentComparator().reversed());
```

### Collections.reverseOrder, Collections.naturalOrder

내림차순 정렬 / 오름차순 정렬을 수행합니다.

```java
Collections.sort(students, Collections.reverseOrder(new StudentComparator()));
students.sort(new StudentComparator());
```

### nullsFirst, nullslast

Null 을 맨 앞에 정렬 / 맨 뒤에 정렬 합니다.

```java
Collections.sort(students, Comparator.nullsFirst(new StudentComparator()));
Collections.sort(students, Comparator.nullsLast(new StudentComparator()));
```

### comparing

JAVA8 에 추가된 Comparator 의 comparing() 을 사용하면 비교 함수를 간단하게 구현할 수 있습니다.

```java
students.sort(Comparator.comparing(Student::getScore));
students.sort(Comparator.comparing(Student::getScore).reversed());
```

### thenComparing

`Comparator` 를 한번 수행하고 다른 `Compataotr` 를 이어서 수행할 수 있습니다.

```java
Comparator compareScore = Comparator.comparing(Student::getScore);
Comparator compareName = Comparator.comparing(Student::getName);

students.sort(compareScore.thenComparing(compareName));
```

---

## Comparable 이 있는데, Comparator 는 왜 필요할까?

`Comparable` 과 `Comparator` 는 결국 인스턴스의 정렬기준을 정의하고 정렬을 도와주는데에 공통점이 있습니다. 그렇다면 왜 제 3자가 두 객체의 우선순위를 비교하는 기능인 `Comparator` 가 필요할까요?

첫번째로는 정렬 대상 클래스의 코드를 수정할 수 없을경우, 두번쨰로는 정렬 대상 클래스에 이미 정의된 `Comparable` 의 `compareTo` 로 이미 정의한 정렬기준이 있을때 다른 기준으로 정렬하고 싶은 경우, 마지막으로는 여러 정렬 기준을 적용하고 싶을 경우에 사용하면 됩니다.

---

## 활용방법

추가적으로 몇가지 유의사항 및 활용방법에 대해 알아봅시다.

### 순서를 고려하는 경우 Comparable 를 꼭 구현하자.

순서를 고려해야 하는 값 클래스를 작성한다면 꼭 Comparable 인터페이스를 구현합시다. Comparable 을 구현하면 compareTo 를 오버라이딩하여 손쉽게 컬렉션을 정렬할 수 있기 때문입니다. 예를들어 알파벳, 숫자, 연대와 같이 순서가 명확한 클래스들이 Comparable 의 구현 대상이 될것입니다.

### 값을 차를 기준으로 비교하지 말자

compareTo 메소드에서 필드의 값을 비교할때 "<" 와 ">" 연산자는 사용하지 말아야합니다. 가령 아래처럼 구현한다면 정수 오버플로우와 부동 소수점 계산방식에 따른 오류가 발생할 수 있습니다. 그 대신 박싱된 기본 타입 클래스가 제공하는 정적 메소드 `compare()` 또는 `Comparator` 생성 메소드를 이용하여 비교해주도록 합시다.

```java
static Comparator<Object> hashCodeOrder = new Comparator<>(
  public int compare(Object o1, Object o2){
    return o1.hashCode() - o2.hashCode();
  }
}
```

---

## 참고

- Effective Java (Joshua Bloch 지음)
- https://veneas.tistory.com/entry/Java-자바-8-Comparator-API-데이터-정렬
- https://blog.hongo.app/comparing/
- https://dding9code.tistory.com/68
- https://gmlwjd9405.github.io/2018/09/06/java-comparable-and-comparator.html
- https://hudi.blog/java-comparable-and-comparator/
- https://velog.io/@neity16/Java-%EA%B8%B0%EB%B3%B83-Comparable-Comparator-%EC%B0%A8%EC%9D%B4%EC%A0%90
