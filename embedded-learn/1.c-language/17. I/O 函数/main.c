// ...existing code...
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <limits.h>
#include <string.h>

// static int read_int(const char *prompt) {
//     char buf[128];
//     char *end;
//     long val;

//     while (1) {
//         if (prompt) printf("%s", prompt);
//         if (fgets(buf, sizeof buf, stdin) == NULL) {
//             fprintf(stderr, "输入失败\n");
//             exit(1);
//         }

//         // 去掉行尾换行
//         buf[strcspn(buf, "\r\n")] = '\0';

//         // 使用 strtol 解析
//         val = strtol(buf, &end, 10);

//         // 跳过末尾空白
//         while (isspace((unsigned char)*end)) end++;

//         // 检查是否有至少一个数字并且末尾没有多余非空字符
//         if (end != buf && *end == '\0') {
//             if (val < INT_MIN || val > INT_MAX) {
//                 printf("值超出 int 范围，请重新输入。\n");
//                 continue;
//             }
//             return (int)val;
//         }

//         printf("不是有效的整数，请重新输入。\n");
//     }
// }

// int main(void) {
//     int i = read_int("请输入第一个整数：");
//     int c = read_int("请输入第二个整数：");
//     printf("%d\n", (i + c));
//     return 0;
// }
// ...existing code...

int main(void) {
    int i,j;
    float x,y;
    scanf("%d%d%f%f", &i, &j, &x, &y);
    printf("%d %d %.2f %.2f\n", i, j, x, y);
    return 0;
}