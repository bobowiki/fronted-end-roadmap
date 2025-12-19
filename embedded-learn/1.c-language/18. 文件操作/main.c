#include <stdio.h>

int main()
{
    FILE *fp;
    int c;
    fp = fopen("a.txt", "r");
    if (fp == NULL)
    {
        return -1;
    }
    while ((c = fgetc(fp)) != EOF)
    {
        printf("%c", c); // 不要加\n，否则每个字符单独一行
    }

    fclose(fp);
    return 0;
}