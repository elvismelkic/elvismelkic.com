---
title: "How to unit test the content you're uploading"
summary: "In this post we'll see how to test the content of the files we're uploading, and thus increase the test coverage of our app."
date: 2020-12-18 22:48:15
category: 'Elixir'
draft: false
---

In recent times, it’s become quite popular to upload files created by the users of our app to various cloud providers. Since we're all responsible developers and we unit test our apps, we should also test the content of the files we’re uploading.

If we have a module responsible for generating files, things are pretty straightforward - we generate some input data, call the module’s function, and check the results. But what if we generate a file in a private function of some module and upload it from there? Let’s say that we're dealing with receipts in our app, and we’re storing them on AWS’s S3. We would probably have a designated `Receipt` module with a public function `store_on_s3`, which internally calls a private function `generate_file` and it passes the generated file off to some AWS dependency’s `upload` function. Using some simplified dummy data, it’ll look something like this:

```elixir
defmodule Receipt do
  # …

  @type receipt_data :: %{
          buyer_name: String.t(),
          seller_name: String.t(),
          price: integer()
        }

  @spec store_to_s3(receipt_data) :: :ok
  def store_to_s3(data) do
    data
    |> generate_file()
    |> OurAwsS3Service.upload()
  end

  defp generate_file(data) do
    "Buyer: #{data.buyer_name}\nSeller: #{data.seller_name}\nPrice: #{data.price}"
  end

  # ...
end
```

Let’s ignore that this code lacks some encapsulation (`OurAwsS3Module` should be `CloudService` or more generic `StorageService` and it should deal with S3 internally), the question is how do we go about testing the file's contents? We don’t want to expose a private function any time we want to test something.

Since we're dealing with uploading files, which we don’t want to create and upload somewhere every time we run the tests locally, chances are that we’re using mocks. In that case, we have access to our file’s content in our stubbed function, so we can use that to test it. Let's see how we'd do it. (Having your mocks set up is a prerequisite, since that’s not the point of this post. If you want to read up on that, the [documentation](https://hexdocs.pm/mox/Mox.html) is a good start, and I also liked this [post](https://nts.strzibny.name/elixir-mocking-mox/).)

```elixir
defmodule OurTest do
  use ExUnit.Case
  import Mox

  # ...

  test "tests file’s content" do
    receipt_data = %{
      buyer_name: "John",
      seller_name: "Mark",
      price: 75
    }

    test_pid = self()

    stub(OurAwsS3ServiceMock, :upload, fn content ->
      send(test_pid, {:uploaded, content})

      :ok
    end)

    Receipt.store_to_s3(receipt_data)

    assert_received({:uploaded, content})

    assert content =~ "John"
    assert content =~ "Mark"
    assert content =~ "75"
  end
end
```

Let’s break it down.

First, we generate some data, nothing special there. Then we bind our test’s PID to a variable, after which we stub our `upload/1` function. Now, here comes the important part. Our stubbed function receives the file (in this case it’s just a content in the form of a string), which we send back to the test using its PID we bound earlier. Back in the test, we call `store_to_s3/1`, which will internally call our stubbed function, and then we use `assert_received/2` to assert that we’ve received the message with the content. After that, we assert the content of our file.

## Why not assert in stubs?

While I was writing this post, I started to wonder “Hey, why send the content? Why not simply assert it inside the mock function?” The only reason that came to my mind is that you would want to have all your assertions at the end of the test (the so-called [AAA pattern](https://medium.com/@pjbgf/title-testing-code-ocd-and-the-aaa-pattern-df453975ab80)). If you ask me, code aesthetics is a good enough reason in itself, but I wanted to know if it makes any difference at the execution level. So I asked a (much) more knowledgeable colleague of mine.

As it turns out, the main thing we want to make sure is that our mock function gets called. If we do our assertions inside the mock, and the mock doesn’t get called during the test, the test could still pass. By sending the content back to the test and asserting that we’ve received it, we’re making sure that our mock gets called. There is also another way to do this. We can replace `stub/3` with `expect/4`, and call `verify!/0` after our mock gets called (or `verify_on_exit!/1` anywhere in the test). That way, we’ll ensure that the test will fail if our mock doesn’t get called, making it able to do our assertions inside the mock function.

Altering our previous example, it would look something like this:

```elixir
# ...

test "tests file’s content" do
  verify_on_exit!() # Use this one...

  receipt_data = %{
    buyer_name: "John",
    seller_name: "Mark",
    price: 75
  }

  expect(OurAwsS3ServiceMock, :upload, fn content ->
    assert content =~ "John"
    assert content =~ "Mark"
    assert content =~ "75"

    :ok
  end)

  Receipt.store_to_s3(receipt_data)

  verify!() # ...or this one.
end

# ...
```

Still, I would always opt for doing all the assertions at the end of the test. Not only does it make more sense and is visually more appealing (in my humble opinion), but there is also only one place to look at if you want to figure out what that test is all about (ideally, test description should be enough by itself, but we all know how that can turn out).

## Conclusion

In this article we’ve learned how to test the file's content if we don't have a designated module for generating files. I hope you'll find it useful and that it will help you produce better test coverage of your code. Thank you for reading and have a nice day! :)
