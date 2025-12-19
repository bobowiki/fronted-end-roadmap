#include <stdio.h>

int main(void) {
    enum colors { RED, GREEN, BLUE };
    enum colors favorite_color;
    favorite_color = GREEN;
    favorite_color = 100; // 允许赋值为枚举外的整数值
    printf("RED = %d, GREEN = %d, BLUE = %d\n", RED, GREEN, BLUE);
    printf("My favorite color is %d\n", favorite_color);
    return 0;
}