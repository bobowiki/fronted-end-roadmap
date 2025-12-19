#include <stdio.h>
#include <string.h>

// int i = 0;

// int main(void)
// {

//     // 参数为数据类型
//     int b = sizeof(int);
//     printf("size of int: %d\n", b);
//     // 参数为变量
//     int i;
//     int d = sizeof(i);
//     printf("size of i: %d\n", d);

//     // 参数为数值
//     int c = sizeof(3.14);
//     printf("size of 3.14: %d\n", c);

//     int x;
//     printf("%i Hello, Embedded World!\n\n\n", x);
//     while (i < 10)
//     {
//         printf("i is now %d!\n", i);
//         i++;
//     }

//     printf("All done!\n");
//     return 0;
// }
// int i = 0;

// void foo(void) {
//     printf("In foo function %d\n",i);
// }

// int main(void) {
//     i++;
//     printf("%i Hello, Embedded World!\n", i);
//     foo();
//     return 0;
// }

// void bar(void) {
//     printf("In bar function %d\n",i);
// }
// bar();

// int a = 0;

// void foo(int a) {
//     a = 100;
// }

// int main() {
//     foo(a);
//     printf("a is %d\n", a);

//     return 0;
// }
// char c[5] = "hello";

// int main() {
//     printf(&c);
//     return 0;
// }

// int a[5] = {1, 2, 3, 4, 5};

// int main() {
//  for(int i = 0; i < 5; i++) {
//      printf("a[%d] = %d\n", i, *(a + i));
//  }
// // printf("a[0] = %d\n", *a);
//     return 0;
// }

// int main(void)
// {
//     int a[] = {11, 22, 33, 44, 55, 999};

//     int *p = a;
//     while (*p != 999)
//     {
//         printf("%d\n", *p);
//         p++;
//     }
//     return 0;
// }

// int main(void) {
//     int a = 100;
//     printf("%dhello a", *&a);
//     return 0;
// }

// void swap(int* x,int* y) {
//     int temp = *x;
//     *x = *y;
//     *y = temp;
// }

// int main(void) {
//     int a = 100;
//     int b = 500;
//     swap(&a,&b);
//     printf("a=%d,b=%d\n",a,b);
//     return 0;
// }

// int main(void) {
//     char* s = "hello world";
//     strcpy
//     printf("length of s is %lu\n", strlen(s));
//     return 0;
// }

// char *stringCopy(char *dest, const char *src)
// {
//     char *ret = dest;
//     while ((*dest++ = *src++) != '\0');
//     return ret;
// }

// int main(void)
// {
//     char *str = "Hello, World!";
//     char *copy = "hello"

// }

// int main(void) {
//     char s[] = "hello world";
//     // 不能改变其对应的地址
//     // s = "hello";
//     s[1] = 'a';
//     // 指针可以直接改变地址
//     char *s1 = "hello world";
//     char s2[] = "hello world111";
//     s1 = s2;
//     printf("%s\n", s);

//     printf("%s\n", s1);
//     printf("%c\n", s1[1]);
// }

// int main(void)
// {
//     char s1[40];
//     char s2[12] = "hello world";

//     strncpy(s1, s2, 5);
//     // s1[5] = '\0';

//     printf("%s\n", s1); // hello
//     return 0;
// }
// int main(void)
// {
//     char s1[12] = "hello";
//     char s2[6] = "world";

//     char *s = strcat(s1, s2);
//     printf("%c\n", *(s + 2)); // helloworld
//     printf("%s\n", s1); // helloworld

// }

int stringCompare(const char *s1, const char *s2) {
  while(*s1 && (*s1 == *s2)) {
    s1++;
    s2++;
  }
  // 比较最后一个不同字符的ASCII值差值，如果他们想等最后一个字符都是'\0'，则返回0，如果不等则返回差值
  return *(const unsigned char*)s1 - *(const unsigned char*)s2;
}
