FROM python:3

WORKDIR /PROJECT

RUN pip install flask
RUN pip install nnf

COPY dsharp /bin/dsharp
COPY . .
RUN rm dsharp

CMD /bin/bash
