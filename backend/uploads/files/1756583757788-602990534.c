
#include <stdio.h>
#include <time.h>

long long fib_iter(int n) {
    if (n == 0 || n == 1)
        return 1;

    long long prev1 = 1, prev2 = 1, curr;
    for (int i = 2; i <= n; i++) {
        curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return curr;
}

int main() {
    int n;
    printf("Enter n: ");
    scanf("%d", &n);

    clock_t start = clock();
    long long result = fib_iter(n);
    clock_t end = clock();

    double time_taken = (double)(end - start) / CLOCKS_PER_SEC;

    printf("Fibonacci(%d) = %lld\n", n, result);
    printf("Time taken = %f seconds\n", time_taken);

    return 0;
}
