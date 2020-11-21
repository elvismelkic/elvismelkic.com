---
title: 'Why, when and how to optimize your recursion'
summary: 'Sometimes you have to recursively iterate over a possibly too large set of data. Find out how to protect yourself from running out of memory.'
date: 2020-11-21 23:22:15
category: 'Programming, Elixir'
draft: false
---

I believe there are enough articles all over the Internet explaining recursion, so I’ll try not to saturate it with yet another one. In this blog post I’ll try to show a possible issue which could arise from using recursion, and, hopefully, how to solve it.

Let’s start off with a simple task of summing the first n numbers. It would look something like this:

```elixir
def sum_up_to(0), do: 0
def sum_up_to(n), do: n + sum_up_to(n - 1)
```

There is one problem with this code (actually, there are two problems, but we’ll ignore that one could start an infinite loop by passing a negative number to the function). What would happen if we passed a huge number to the function? To answer that question, let’s start small and see what happens there. Let’s calculate the sum of the first five positive integers.

```
sum_up_to(5)
-> 5 + sum_up_to(4)
-> 5 + 4 + sum_up_to(3)
-> 5 + 4 + 3 + sum_up_to(2)
-> 5 + 4 + 3 + 2 + sum_up_to(1)
-> 5 + 4 + 3 + 2 + 1 + sum_up_to(0)
-> 5 + 4 + 3 + 2 + 1 + 0
-> 5 + 4 + 3 + 2 + 1
-> 5 + 4 + 3 + 3
-> 5 + 4 + 6
-> 5 + 10
-> 15
```

As you can see, not a single function call can get resolved until we get to the base case, at which point, we start going backwards, summing the numbers along the way. Now, imagine if we passed one million as an argument. Or one billion. Or any other huge number. We’d run into what’s called a stack overflow. Our function calls would stack up on one another and we would reach the limit of the number of elements our stack can take. In other words, we’d run out of memory. The unfortunate result of that is our program crashing.

This simple example probably isn’t something you would face in the real world, but having a data structure so large that it causes a stack overflow when you recursively iterate over it could really happen. It happened at my job.

Luckily, there is a way to save our program from such fate. It’s called tail-optimization. Basically, what it means is this: if on the last line of your function you only have a call to the same function, the new call won’t stack on the previous one, but it will rather replace it. Let’s see how we would do it in practice.

## Optimizing the tail

On every step of recursion, we calculate a piece of the final result. If we want our recursion to be tail-optimized, we have to follow one simple rule - the next step has to receive the current state (result calculated up to that point) and the next argument. In practice, that usually means we have to make a helper function.

Let’s go back to our sum example to see how that would be done.

```elixir
def tail_sum_up_to(n), do: do_sum(n, n - 1)

defp do_sum(current_sum, 0), do: current_sum

# This is where the magic happens. Notice how we’re passing the sum
# we’ve calculated up to that point and the next value in the sequence.
defp do_sum(current_sum, n) do
    new_sum = current_sum + n
    next_value = n - 1

    do_sum(new_sum, next_value)
end
```

A cleaner version of that function would look something like this:

```elixir
defp do_sum(current_sum, n), do: do_sum(current_sum + n, n - 1)
```

In this case, we can also expect a performance improvement, but that’s not always the case (I’ll get to that later). Now, let’s move onto a bit more complex example.

## Rewriting _Enum.map/2_ using tail-recursion

To finish this post off, I’ll write the equivalent of `Enum.map/2` using tail-recursion. First, let’s see how it would look using regular recursion.

```elixir
def our_map([], _fun), do: []
def our_map([head | tail], fun), do: [fun.(head) | our_map(tail, fun)]
```

Doing the tail version is a bit trickier. Since we have to pass the current state into the next step, that means we have to have a new list which we’ll populate on each step and pass it on. If we want to keep the performance benefits, we have to take into account that lists in Elixir are linked lists, therefore we want to _prepend_ the newly calculated elements to the new list. This results in a reversed list compared to the original list, so we’ll also have to reverse it back. Let’s see how we’d do all that.

```elixir
def tail_map(list, fun), do: [] |> do_map(list, fun) |> reverse()

defp do_map(acc, [], _fun), do: acc

defp do_map(acc, [head | tail], fun) do
    newly_calculated_element = fun.(head)
    acc = [newly_calculated_element | acc]

    do_map(acc, tail, fun)
end
```

As before, let’s clean it up a bit:

```elixir
defp do_map(acc, [head | tail], fun), do: do_map([fun.(head) | acc], tail, fun)
```

Now, we just have to reverse it.

```elixir
defp reverse(list), do: do_reverse([], list)

defp do_reverse(acc, []), do: acc
defp do_reverse(acc, [head | tail]), do: do_reverse([head | acc], tail)
```

As you can imagine, iterating over a set of data twice is probably not the most efficient thing to do. It’s best to assess the kind of data you’re dealing with and go from there.

## Conclusion

Whenever we’re dealing with iterating over a particularly large set of data, tail-recursion might be an appropriate solution to avoid memory issues. But, as we saw, it’s not the be-all and end-all solution.

So, the question remains: when should you use tail-optimization and when is it OK to settle for a regular recursion? A colleague of mine said to me once: “Use the one which is more readable. More often than not, it’s a non-tail version.” Of course, presuming you don’t run out of memory. But that goes without saying. :)

I hope this post will help you not run out of your memory. As always, if you see a mistake or a place for improvement, feel free to let me know in the comments. Thanks for reading and have a nice day! :)
