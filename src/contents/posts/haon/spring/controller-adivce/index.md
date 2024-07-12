---
title: ControllerAdvice 를 통한 통합 예외처리를 해보자!
date: "2023-08-13"
tags:
  - 스프링
  - ControllerAdvice
previewImage: spring.png
---

## 도입배경

과거 무심코 예외처리 구현했던 방식과 비교해보면서, 왜 사용하는것인지를 정리해보고자 합니다.

---

## 다양한 애플리케이션 예외처리 방식

자바 애플리케이션을 개발하다보면 예외는 어디서나 터질수가있고, 예상치도 못한 범위를 벗어나서도 예외는 얼마든지 발생할 수 있습니다. 때문에 상세하고 다양한 예외들을 얼마든지 처리해줄 수 있는 방법이 있다면 정말 편할겁니다.

### 기본적인 예외처리 방법

스프링부트 애플리케이션을 개발하다보면, 저희는 일반적으로 메소드 내에서 `try-catch` 문으로 가장 기초적인 예외처리를 진행하는 예외처리 방식을 고려해볼 수 있을겁니다. 예를들어 아래와 같은 방식으로 처리를 하겠죠.

```java
@Transactional
public void order(Request request) throws Exception{
  try {
       // (1)
   } catch (Exception e){
       // (2)
   }
}
```

`(1)` 에서는 비즈니스 규칙에 따라 입력 유효성을 검증하는 로직이 포함될 수 있으며, (몰론 아키텍처에 따라 각기 다르다) 비즈니스 로직 수행중 유효하지 않은 예외상황이 발생한다면 예외를 던질 수 있을겁니다. `(1)` 에서 던져진 예외는 `(2)` 에서 처리될겁니다.

위 코드를 더 구체화해보자면, 아래와 같습니다. 하지만 이 처리방식의 문제점은 뭘까요?

```java
@Transactional
public void order(Request request) throws Exception{
  try {
  	   if(request.getMoney() < 10000)
       	   throw new RunTimeException("잔액이 부족합니다");

       if(userRepository.existsById(request.getId()))
           throw new RunTimeExcpetion("이미 존재하는 회원입니다.");
       // ... (비즈니스 로직)

   } catch (Exception e){
       // ... (예외처리)
   }
}
```

### 예외처리의 한계, 전역 & 통합 예외관리의 필요성

이 방식은 세부적인 예외상황을 핸들링하는데 한계가 있습니다. 위 코드처럼 비즈니스 규칙을 검증하는데 있어서 if 문을 활용할 것이며, 이렇게 if 문을 남용하다보면 분명 가독성이 많이 떨어지게 됩니다.

또한 모든 예외상황에 대한 처리가 상위 클래스인 `Exception` 으로 모아지는데, 각 예외상황에 대해 모두 동일한 예외처리가 수행되므로, 해당 메소드에서 예외가 터진다면 정확히 어떤 예외 상황이 터진것인지 식별하는것이 꽤나 힘듭니다.

또한 try-catch 문이 각 메소드마다 처리된다면, 불필요하게 중복되는 코드가 발생하는 꼴입됩니다. 가능하다면 바로 이어서 설명할 `@ControllerAdvice` 를 활용하여 전역 예외처리를 구현하고, 애플리케이션 전역에서 발생하는 모든 예외 상황들에 대해 한곳에서 통합 관리하는 방식이 더 좋을겁니다.

따라서 유지보수 및 비즈니스 로직에 집중하기 위해서, 또 비즈니스 로직과 관련한 예외 상세 케이스들을 통제하기 위해서 `@ExceptionHandler` 와 `@ControllerAdvice` 를 사용하지 않을 이유가 없습니다. 필요성을 깨달았으니, 지금부터 해당 방식을 알아봅시다.

---

## @ExceptionHandler

먼저 `@ExceptionHandler` 는 스프링에서 제공하는 `@Controller` 또는 `@RestController` 가 적용된 Bean 에서 try-catch 를 이용한 예외처리를 어노테이션을 통해 간편한 처리를 도와주는 어노테이션입니다. 예외 발생시의 리턴 타입은 자유롭게 진행해도됩니다. **즉, 프로젝트의 상황에 따라 예외 발생시에 반환할 커스텀 클래스를 하나 정의해두고, 그 형식에 알맞게 Response 를 보내줘도 됩니다.**

사용시 주의할점은, Controller 와 RestCOntroller 에만 적용가능하기 때문에 `@Service` 등에는 적용 불가능합니다.

### Controller 에 적용하기

아마 가장 궁금해하셨을 적용 코드 예시입니다. `(1)` 에는 우리가 흔히 살펴보던 API 통신을 위한 메소드의 정의부입니다. 반면 `(2)` 와 `(3)` 에는 `@ExceptionHandler` 가 설정된 것을 볼 수 있는데, 현재 OrderController 에서 발생하는 예외중 RunTimeException, NullPointerExcpetion 가 발생했을때 어떻게 처리해줄지에 대한 로직이 정의되어 있습니다.

```java
@RestController
@RequiredArgsConstructor
public class OrderController{
	private final OrderService orderService;

    @PostMapping("/order")
    public ResponseEntity<OrderResponseDto> makeOrder(){
    	// (1)
    }

    @ExceptionHandler(value = RunTimeException.class)
    public ResponseEntity<OrderIOExcpetionResponse> orderIOHandler(IOException ex){
    	// (2)
    }

	@ExcpetionHandler(value = NullPointerException.class)
    public ResponseEntity<OrderNullExcpetionResponse> orderNullHandler(){
        // (3)
    }
}
```

즉, `value` 에는 아떤 예외를 잡아서 핸들링할지를 명시해줘야 합니다. 이때 value 를 별도 지정하지 않으면 모든 예외를 잡기 떄문에, 필요한 세부 예외를 지정해주는게 좋습니다.

---

## @RestControllerAdvice

### 순수 @ExceptionHandler 활용의 번거로움

앞선 코드를 이해했다면, 뭔가 아쉬움을 느꼈을수도 있습니다. `@ExceptionHandler` 는 등록된 해당 컨트롤러에서만 적용이 되죠. 하지만 순수히 `@ExceptionHandler` 만 사용해서는 특정 하나의 컨트롤러 외에, 모든 여러 컨트롤러에서 발생하는 예외를 잡을 수 없습니다.

이러할때 `@RestControllerAdvice` 를 도입하면 위 문제가 해결됩니다. **즉, 같은 예외가 발생했다면 같은 처리를 해주고 싶을때 활용하면 됩니다.** 똑같은 기능을 똑같이 각 컨트롤러마다 반복해서`@ExcpetionHandler` 를 정의해서 중복 코드를 반복하는 일을 없앨 수 있게 됩니다.

### 통합 예외처리기 도입

전역 예외처리는 아래와 같이 `@RestControllerAdvice` 를 활용한 클래스를 하나 정의했습니다. 이로써 모든 컨트롤러에서 발생하는 예외상황은 공통 형식으로 처리될겁니다.

이때 예외가 발생했을때 공통 형식으로 응답하기 위한 "공통 응답객쳬" 로 `BaseExceptionResponse` 를 정의했으며, 비즈니스 로직 수행중 조건에 어긋나는 상황에 대한 비즈니스 예외를 핸들링하기 위해 `BusinessExceptionResponse` 라는 커스터마이징 클래스를 정의한 것을 볼 수 있습니다.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler // 비즈니스 로직 예외처리
    protected ResponseEntity<BaseExceptionResponse> serviceExcpetion(BusinessExceptionResponse serviceExceptionResponse) {
        BaseExceptionResponse response = BaseExceptionResponse.makeErrorResponse(ErrorBaseResponseCode.BUSINESS_EXCEPTION);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler // Method 예외처리
    protected ResponseEntity<BaseExceptionResponse> methodException(HttpRequestMethodNotSupportedException e) {
        BaseExceptionResponse response = BaseExceptionResponse.makeErrorResponse(ErrorBaseResponseCode.METHOD_NOT_ALLOWED);
        return new ResponseEntity<>(response, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ...
```

### @RestControllerAdvice VS @ControllerAdivce

현 포스팅과 관련해 더 키워드를 찾아보면 둘의 차이점이 등장할겁니다. 요약하면 아래와 같습니다.

> @RestControllerAdvice = @ControllerAdvice + @ResponseBody

**@RestControllerAdvice** 는 **@ControllerAdvice** 와 동일한 역할을 수행하지만, 단지 객체를 반환할 수 있다는 차이점만이 있습니다. 즉, **@ControllerAdvice** 와 달리 **@RestControllerAdvice** 는 응답의 body 에 객체를 넣어 반환이 가능합니다.

---

## 더 학습해볼 키워드

- 공통 응답객체 정의 (super 상속)

---

## 참고

- https://tecoble.techcourse.co.kr/post/2021-05-10-controller_advice_exception_handler/
- https://zayson.tistory.com/entry/RestControllerAdvice-ExceptionHandler를-이용한-전역-예외-처리
- https://jeong-pro.tistory.com/195
