// #include <stdio.h>

// #define MAX 100
// #define OW "C programming language is invented \
// in 1970s."
// #define FOO "hello"

// #define SQUARE(X) (X)*(X)

// int main(void) {
//     printf("MAX = %d\n", MAX);
//     printf("%s\n", OW);
//     printf("%s\n", FOO);
//     printf("SQUARE(5) = %d\n", SQUARE(5));
//     return 0;
// }

#include <stdio.h>

int main(void) {
  printf("This function: %s\n", __func__);
  printf("This file: %s\n", __FILE__);
  printf("This line: %d\n", __LINE__);
  printf("Compiled on: %s %s\n", __DATE__, __TIME__);
  printf("C Version: %ld\n", __STDC_VERSION__);
}
