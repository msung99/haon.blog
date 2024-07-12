---
title: 자바의 스트림(Stream) 이란 무엇이고, 어떻게 사용하는걸까?
date: "2023-10-24"
tags:
  - JAVA
  - stream
previewImage: java.png
series: JAVA, 객체지향, 디자인패턴 학습기록
---

## 학습배경

스트림에 대한 이해도가 부족하여 원활히 활용하지 못하고 있습니다. 이번 기회에 스트림에 대해 개념을 제대로 학습하고, 추후 코드 작성에도 매끄럽게 활용해보고자 합니다. **때문에 이번 포스팅은 개념정리본이 될 것이고, 추후 스트림을 활용한 내용은 추후에 별도로 다루도록 하겠습니다.**

---

## 왜 스트림? (vs 컬렉션, 배열)

스트림은 기존에 컬렉션과 배열을 활용하는 방식에 비해 가독성과 재사용성을 높이고, 모든 데이터 소스를 `추상화`하여 호환성을 높인 기능입니다. 여기서 추상화란, 데이터 소스가 무엇이던간에 같은 코드 및 방식으로 다룰 수 있게 만들어놓았다는 것을 의미합니다.

---

## 스트림의 특징

스트림의 가장 큰 특징 및 사용법에 대해 알아봅시다.

### 스트림은 데이터 소스 자체를 변경하지 않는다.

우선 스트림은 데이터 소스(컬렉션, 배열) 로 부터 데이터를 읽기만 할뿐, 데이터 소스 자체를 변경하지 않습니다. 정렬된 결과를 컬렉션이나 배열에 담아서 반환할 수도 있습니다.

```java
Stream<String> strStream1` = strList.stream();

// 정렬된 결과를 새로운 리스트에 담아서 반환한다.
List<String> sortedList = strStream1.sorted().collect(Collectors.toList());
```

### 스트림은 일회용이다.

스트림은 Iterator 처럼 일회용으로, 스트림은 한번 사용하면 닫혀서 다시 사용할 수 없습니다. **즉, 스트림은 재사용이 불가능하므로 필요하다면 스트림을 다시 생성해야합니다.**

```java
strStream1.sorted().forEach(System.out::println);
int numOfStr = strStream1.count(); // -> 에러발생 (스트림이 이미 닫혀있는데 재사용 시도함)
```

### 스트림의 중간연산, 최종연산

스트림에서 제공하는 다양한 연산을 이용해서 복잡한 작업들을 간단히 처리할 수 있습니다. 연산의 종류에는 `중간 연산` 과 `최종 연산` 으로 분류할 수 있는데, 각 특징은 다음과 같습니다.

> - 중간연산 : 연산결과를 스트림으로 반환하기 때문에 **중간 연산을 연속해서 연결할 수 있다.**

- 최종연산 : 연산 결과가 스트림이 아니다. 때문에 스트림의 요소를 소모하므로 **단 한번만 가능하다.**

```java
stream.distinct().limit(5).sorted().forEach(System.out::println);
// distinct, limit, sorted : 중간연산  / forEach : 최종연산
```

### Stream 연산종류

Stream 에 정의된 연산을 나열해보자면 아래와 같습니다. 이 중 몇가지 연산만 사용해 볼 것이고, 필요한 연산들은 그때마다 찾아보고 보충해봅시다.

| 중간연산                                           | 설명                                                                                                 |
| :------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| distinct()                                         | 중복을 제거                                                                                          |
| filter()                                           | 조건에 안 맞는 요소제외                                                                              |
| limit()                                            | 스트림의 일부를 잘라낸다.                                                                            |
| skip()                                             | 스트림의 일부를 건너뛴다.                                                                            |
| peek()                                             | 스트림의 요소에 작업수행                                                                             |
| sorted()                                           | 스트림의 요소를 정렬한다.                                                                            |
| map()                                              | 스트림의 요소를 반환한다. (반환타입 : String< R >                                                    |
| mapToDouble(), mapToInt(), mapToLong()             | 스트림의 요소를 반환한다. (반환타입 : IntStream, DoubleStream, LongStream)                           |
| flatMap()                                          | 스트림의 요소를 반환한다. (반환타입 : Stream< R >                                                    |
| flatMapToDouble(), flatMapToInt(), flatMapToLong() | 스트림의 요소를 반환한다. (반환타입 : IntStream, DoubleStream, LongStream)                           |
| forEach()                                          | 각 요소에 지정된 작업 수행                                                                           |
| count()                                            | 스트림의 요소 개수 반환                                                                              |
| findAny(), findFirst()                             | 스트림의 최댓값, 최솟값을 반환                                                                       |
| allMatch(), anyMatch(), noneMatch()                | (주어진 조건을) 모두 만족하는지 / 하나라도 만족하는지 / 모두 만족하지 않는지                         |
| reduce()                                           | 스트림의 요소를 하나씩 줄여가면서 계산한다.                                                          |
| collect()                                          | 스트림의 요소를 수집한다. 주로 요소를 그룹화하거나, 분할한 결과를 컬렉션에 담아 반환하는데 사용한다. |

### Stream< IntStream > 와 IntStream

요소의 타입이 T 인 스트림은 기본적으로 Stream< T > 이지만, 오토방식 및 언방식으로 인한 비효율성을 줄이기위해 데이터 소스의 요소를 기본형으로 다루는 스트림, `IntStream`, `LongStream`, `DoubleStream` 이 제공됩니다.
일반적으로 Stream< Integer > 대신 IntStream 을 사용하는 것이 더 효율적이고, IntStream 에는 int 타입의 값으로 작업하는데 유용한 메소드들이 포함되어 있으므로, 이를 사용하는 것이 일반적으로 더 좋습니다.

---

## 스트림 생성하기

지금부터 스트림의 기본 연산 및 생성방법에 대해 간단히 알아보겠습니다. 스트림의 소스가 될 수 있는 대상은 컬렉션, 배열, 임의의 수등 다양하며, 이 다양한 소스들로부터 스트림을 생성하는 방법에 대해 알아봅시다.

### 컬렉션

컬렉션의 최상위 조상인 `Collection` 에 `stream()` 이 정의되어 있으므로, Collection 의 자손인 List, Set 을 구현한 **컬렉션 클래스들은 모두 이 stream() 으로 스트림을 생성할 수 있습니다.**

```java
List<Integer> list = Arrays.asList(1,2,3,4,5);
Stream<Integer> intStream = list.stream();

intStream.forEach(System.out::println); // 정상 수행됨
intStream.forEach(System.out::println); // 에러 발생
```

이때 주의할점은, 위처럼 `forEach()` 가 **스트림의 요소를 소모하면서 작업을 수행**하므로, 같은 스트림에 forEach() 를 2번 호출할 수 없습니다. 따라서 스트림의 요소를 한번 더 출력하려면 스트림을 새롭게 생성해야합니다. 또한 forEach() 에 의해 스트림의 요소가 소모되는 것이지, 원본 소스의 요소들이 소모되는 것은 아니기때문에, 같은 소스로부터 다시 스트림을 생성할 수 있습니다.

### 배열

배열에 대해 스트림 변환과정은 아래처럼 문자열 스트림으로 변형이 가능하며, 기본형(int, long, double) 과 같은 기본형 배열을 소스로 하는 스트림을 생성하느 메소드도 있습니다.

```java
// 문자열 스트림 생성
Stream<String> strStream = Stream.of("a", "b", "c");
Stream<String> strStream = Stream.of(new String[]{"a", "b", "c"});

// 기본형(int, long, double) 배열에 대한 스트림 생성
IntStream intStream = IntStream.of(arr1);
IntStream intStream = Arrays.stream(arr1);
```

이 외에도 long, double 타입의 배열로 부터 LongStream 과 DoubleStream 을 반환하는 메소드들이 있지만, 여기서 일일이 나열하진 않겠습니다.

---

## 스트림의 중간연산

앞서 컬렉션, 배열등의 데이터 소스를 스트림으로 생성하는 방법에 대해 알아봤습니다. 지금부터는 스트림의 수많은 연산들중에, 가장 기초 연산들에 대해서만 일부분을 알아보겠습니다. 앞서 말했듯이, 자세한 연산 기능들은 필요할때마다 보충하는 방식으로 학습할 예정입니다.

### 빈 스트림 생성 : empty()

요소가 없는 빈 스트림 생성입니다. 스트림에 연산을 수행한 결과가 하나도 없을때, null 보다 빈 스트림을 반환하는것이 낫습니다.

```java
Stream emptyStream = Stream.empty(); // 빈 스트림을 생성해서 반환함
long count = emptyStream.count();  // 0 이 담김
```

### 두 스트림간의 연결 : concat()

`concat()` 을 사용하면 두 스트림을 하나로 연결할 수 있습니다. 몰론 연결하려는 두 스트림의 요소는 같은 타입이여야 합니다.

```java
Stream<String> strArr1 = Stream.of(str1);
Stream<String> strArr2 = Stream.of(str2);
Stream<String> strArr3 = Stream.concat(str1, str2); // 두 스트림을 하나로 병합
```

### 스트림의 요소 필터링하기 : filter(), distinct()

`distinct()` 에서 중복된 요소를 제거하고, `filter()` 는 주어진 조건에 부합하는 요소만을 추출해냅니다.

```java
IntStream intStream = IntStream.rangeClosed(1, 10);
intStream.filter(i -> i % 2 == 0).forEach(System.out::println); // 2 4 6 8 10
```

filter() 의 경우 아래처럼 여러개의 조건을 추가 가능합니다.

```java
intStream.filter(i -> i%2 != 0 && i%3 != 0).forEach(System.out::println);
intStream.filter(i -> i%2 != 0).filter(i -> i%3 != 0).forEach(System.out::println);
```

### 정렬 : sorted()

다음으로 정렬을 위해선 sorted() 를 사용할 수 있습니다. sorted( ) 안의 인자로 Comparator, 람다식등의 특별한 정렬기준을 넣을 수 있으니 참고합시다. 또 별도의 인자가 없다면 기본정렬로 사전순 정렬을 수행합니다.

```java
Stream<String> strStream = Stream.of("dd", "aaa", "CC", "cc", "bb");
strStream.sorted().forEach(System.out::println);
// 결과 : CCaaabbccdd
```

### 변환 : map()

다음으로 map() 을 사용하면 스트림의 요소에 저장된 값 중에서 원하는 필드만 뽑아내거나, 특정 형태로 변환할 수 있습니다. 예를들어 아래처럼 스트램에서 name 필드로만 구성된 String 타입의 스트림으로 변환할 수 있습니다.

```java
Stream<String> userNameStream = userStream.map(User::getName);
```

또한 아래에서 설명할 `Collectors` 를 활용해서도 스트림이 아닌 List, Set 와 같은 일반 컬렉션들로도 변환이 가능해집니다.

```java
List<String> nameList = userList.stream().map(user -> user.getName()).collect(Collectors.toList());
```

### mapToInt(), mapToLong(), mapToDouble()

`map()` 은 연산의 결과로 `Stream<T>` 타입의 스트림을 변환하는데, 스트림의 요소를 숫자로 변환하는 경우 IntStream 과 같은 기본형 스트림으로 변환하는 것이 더 유용할 수 있습니다. `Stream<T>` **타입의 스트림을 IntStream 과 같은 기본형 스트림으로 변환할 때 사용하는 것이 `mapToInt()` 와 같은 메소드들입니다.**

```java
Stream<Integer> studentScoreStream = studentStream.map(Student::getTotalScore);
IntStream studentScoreStream = studentStream.mapToInt(Student::getTotalScore);
int allTotalScore = studentScoreStream.sum();
```

참고로 `count()` 만 지원하는 `Stream<T>` 와 달리, Instream 과 같은 기본형 스트림은 `sum()`, `average()`, `max()`, `min()` 과 같이 숫자를 다루는데 편리한 메소드들을 제공해줍니다.

---

## 스트림의 최종연산

최종 연산은 스트림의 요소를 소모해서 결과를 만들어냅니다. 그래서 최종 연산후에는 스트림에 닫히게 되고 더 이상 사용할 수 없습니다. 최종 연산의 결과는 스트림 요소의 합과 같은 단일 값이거나, 스트림의 요소가 담긴 배열 또는 컬렉션일 수 있습니다.

### forEach()

계속 봤던 forEach() 로, 반환타입이 void 이므로 스트림의 요소를 출력하는 용도로 많이 사용됩니다.

```java
void forEach(Consumer<? super T> action);
```

### 조건 검사

스트림의 요소에 의해 지정된 조건에 모든 요소가 일치하는지(또는 아닌지) 등의 조건을 확인하는데 활용되는 메소드들입니다. 반환타입으로는 모두 boolean 을 리턴합니다. `allMatch()`, `anyMatch()`, `noneMatch()`, `findFirst()`, `findAny()` 등이 이에 해당됩니다.

```java
boolean isSuccess = stuStream.anyMatch(s -> s.getTotalScore() <= 100);
Optional<Student> stu1 = stuStream.filter(s -> s.getTotalScore() <= 100).findFirst();
Optional<Student> sut2 = stuStream.filter(s -> s.getTotalScore() >= 100).findAny();
```

이때 스트림의 요소 중에서 조건에 일칠하는 첫번째 절을 반환하는 findFirst() 가 있는데, 주로 `filter()` 와 함께 사용되어 조건에 맞는 스트림의 요소가 있는지 확인하는데 사용됩니다. 병렬 스트림의 경우는 findAny() 를 사용해야 합니다.

### 통계

`count()`, `sum()`, `average()`, `max()`, `min()` 등이 해당되며, IntStream 과 같은 기본형 스트림 요소들에 대해 통계 정보를 내릴 수 있습니다.

### 리듀싱 : reduce( )

reduce() 는 **스트림의 요소를 줄여나가면서 연산을 수행하고 최종 결과를 반환합니다.** 처음 두 요소를 가지고 연산한 결과를 가지고 그 다음 요소와 연산하며, 이 과정에서 스트림의 요소를 하나씩 소모하게 되며 스트림의 모든 요소를 소모하게 되면 그 결과를 반환합니다.

첫번째 파라미터는 초기값이며, 두번째 파라미터는 연산식입니다.

```java
int count = intStream.reduce(0, (a,b) -> a+1);
int sum = intStream.reduce(0, (a,b) -> a+b);
int max = intStream.reduce(Integer.MIN_VALUE, (a,b) -> a > b ? a:b);
int min = intStream.reduce(Integer.MAX_VALUE, (a,b) -> a < b ? a:b);

OptionalInt max = intStream.reduce(Integer::max);
OptionalInt min = intStream.reduce(Integer::min);
```

---

## Collect

`collect()` 는 스트림의 요소를 수집하는 최종 연산으로, reducing 과 비슷합니다. `collect()` 가 스트림의 요소를 수집하려면, 어떻게 수집할 것인가에 대한 방법이 정의되어 있어야 하는데, 이 방법을 정의한 것이 바로 `컬렉터(collector)` 입니다.

컬렉터는 Collectors 인터페이스를 구현한 것으로, 직접 구현할 수도있고 미리 작성된 것을 사용할수도 있습니다. Collectors 클래스는 미리 작성된 다양한 종류의 컬렉터를 반환하는 static 메소드를 가지고 있으며, 이 클래스를 통해 제공되는 컬렉터만으로도 많은 일들을 할 수 있습니다.

> - collect() : 스트림의 최종연산이다. 매개변수로 컬렉터를 필요로 한다.

- Collector : 인터페이스다. 컬렉터는 이 인터페이스를 구현해야한다.
- Collectors : 클래스다. static 메소드로 미리 작성된 컬렉터를 제공한다.

### 스트림을 컬렉션, 배열로 변환

#### toList()

스트림의 모든 요소를 컬렉션에 수집하려면, Collectors 클래스의 `toList()` 메소드를 사용하면 됩니다.

```java
List<String> names = stuStream.map(Student::getName)
			         .collect(Collectors.toList());
```

#### toCollection()

List 와 Set 이 아닌 특정 컬렉션을 지정하려면, `toCollection()` 에 해당 컬렉션 생성자 참조를 매개변수로 넣어주면 됩니다.

```java
ArrayList<String> list = names.stream()
				.collect(Collectors.toCollection(ArrayList::new));
```

#### toMap()

Map 은 key-value 의 쌍으로 지정해야하므로, 객체의 어떤 필드를 각각 key 와 value 로 사용할지를 지정해줘야 합니다. 아래 예시의 경우는, 요소의 타입이 Person 인 스트림에서 사람의 id 를 key 로 하고, value 로 Person 객체를 그대로 저장합니다.

```java
Map<String, Person> map = personStream.
	collect(Collectors.toMap(person -> person.getId(), person -> person));
```

#### toArray()

스트림에 저장된 요소들을 "T[]" 타입의 배열로 변환하려면 `toArray()` 를 사용하면 됩니다. 단, 해당 타입의 생성자 참조롤 매개변수로 지정해줘야 합니다. 만약 매개변수를 지정해주지 않으면 반환되는 배열의 타입은 "Object[ ]" 입니다.

```java
Student[] stuNames = stdStream.toArray(Student[]::new);
Object[] stuNames = stdStream.toArray();

Student[] stuNames = stdStream.toArray(); // -> 에러발생!
```

### 문자열 결합 : joining()

**문자열 스트림의 모든 요소를 하나의 문자열로 연결**해서 반환합니다. 구분자나 접두사와 접미사를 지정가능하며, **스트림의 요소가 String, StringBuffer 처럼 CharSeqence 의 자손인 경우에만 결합이 가능합니다.** 스트림의 요소가 문자열이 아닌 경우네는 먼저 map() 을 이용해서 스트림의 요소를 문자열로 변환해야 합니다.

```java
String studentNames = stdStream.map(Student::getName).collect(joining());
String studentNames = stdStream.map(Student::getName).collect(joining(","));
String studentNames = stuStream.map(Student::getName).collect(joining(",", "][", "]"));
```

### 리듀싱 : reducing( )

리듀싱 역시 collect() 로 가능합니다. IntStream 에는 매개변수 3개짜리 collect() 만 정의되어 있으므로, `boxed()` 를 통해 IntStream 을 Stream< Integer > 로 변환해야지 매개변수 1개짜리 collect() 를 쓸 수 있습니다.

```java
long sum = intStream.reduce(0, (a,b) -> a+b);
long sum = intStream.boxed().collect(Collectors.reducing(Integer::max));
```

### 통계

마찬가지로 통계기능도 보유하고 있습니다. `counting()`, `summingInt()`, `averagingInt()`, `maxBy()`, `minBy()` 가 해당되죠.

```java
long count = stuStream.count();
long count = stuStream.collect(counting()); // Collectors.counting();

long totalScore = stuStream.mapToInt(Student::getTotalScore).sum();
long totalScore = studStream.collect(Collectors.summingInt(Student::getTotalScore));

OptionalInt topScore = studentStream.mapToInt(Student::getTotalScore.max());
```

### 그룹화와 분할

이에 관련한 내용까지 다룬다면 내용이 너무 깊어지므로, 추후 별도의 포스팅에서 다루고자 합니다. `groupingBy()` , `partitioningBy()` 등이 해당합니다.

---

## 더 학습해볼 키워드

- 스트림 기반 그룹화, 분할
- 람다와 메소드 참조

---

## 참고

- 자바의 정석 (3rd Edition)
- https://jaehyun8719.github.io/2019/07/06/java/java8inaction/chapter6/
- https://isntyet.github.io/java/java-stream-%EC%A0%95%EB%A6%AC(map)/
