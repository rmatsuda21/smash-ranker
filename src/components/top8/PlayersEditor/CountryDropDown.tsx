import { useMemo } from "react";
import * as countryList from "country-list";
import startCase from "lodash/startCase";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";

type Props = {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  disabled?: boolean;
};

export const CountryDropDown = ({
  selectedCountry,
  onCountryChange,
  disabled,
}: Props) => {
  const { _ } = useLingui();
  const options = useMemo(() => {
    const countryOptions = Object.entries(countryList.getNameList()).map(
      ([name, code]) => ({
        id: code,
        value: code,
        display: startCase(name),
        imageSrc: `/assets/flags/${code.toLowerCase()}.svg`,
      })
    );

    return [{ id: "none", value: "", display: _(msg`None`) }, ...countryOptions];
  }, [_]);

  const handleChange = (country: string) => {
    onCountryChange(country);
  };

  return (
    <DropDownSelect
      disabled={disabled}
      options={options}
      selectedValue={selectedCountry}
      onChange={handleChange}
      placeholder={_(msg`Select Country`)}
      searchable
    />
  );
};
