#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    printf("请输入学生人数: ");
    scanf("%d", &n);

    // 动态分配数组内存
    int *scores = malloc(n * sizeof(int));
    if (scores == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 输入成绩
    for (int i = 0; i < n; i++) {
        printf("请输入第 %d 个学生成绩: ", i + 1);
        scanf("%d", &scores[i]);
    }

    // 打印成绩
    printf("\n成绩如下：\n");
    for (int i = 0; i < n; i++) {
        printf("%d ", scores[i]);
    }

    // 释放内存
    free(scores);
    return 0;
}