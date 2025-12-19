#include <stdio.h>

int strcmp(const char* s1,const char* s2);
int main() {
    char* a = "hello";
    char* b = "hello";
    int d = strcmp(a,b);
    printf("%d\n", d);
}
int strcmp(const char* s1,const char* s2) {
    while(*s1 && (*s1 == *s2)) {
        s1++;
        s2++; 
    }
    return *s1 - *s2;
}