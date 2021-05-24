import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { of } from 'rxjs';
import { connect } from '../index';

test('inject can be passed Observable', async () => {
  const NumberComp = (props: { number: number }) => <span data-testid="number">{props.number}</span>;

  const stream = of(0, 1, 2);

  const InjectedNumberComp = connect(stream, (storeProps: number) => ({
    number: storeProps,
  }))(NumberComp);

  const { getByTestId } = render(<InjectedNumberComp />);

  const numberElement = await waitFor(() => getByTestId('number'));

  expect(numberElement.textContent).toEqual('2');
});

test('inject can be passed Observable and props that will override', async () => {
  const NumberComp = (props: { count: number }) => <span data-testid="number">{props.count}</span>;

  const InjectedNumberComp = connect(of({ count: 0 }), { count: 5000 })(NumberComp);

  const { getByTestId } = render(<InjectedNumberComp />);

  const numberElement = await waitFor(() => getByTestId('number'));

  expect(numberElement.textContent).toEqual('5000');
});
