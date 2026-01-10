import { useMemo } from "react";
import * as countryList from "country-list";
import startCase from "lodash/startCase";

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
  const options = useMemo(() => {
    const countryOptions = Object.entries(countryList.getNameList()).map(
      ([name, code]) => ({
        id: code,
        value: code,
        display: startCase(name),
        imageSrc: `/assets/flags/${code.toLowerCase()}.svg`,
      })
    );

    return [{ id: "none", value: "", display: "None" }, ...countryOptions];
  }, []);

  const handleChange = (country: string) => {
    onCountryChange(country);
  };

  return (
    <DropDownSelect
      disabled={disabled}
      options={options}
      selectedValue={selectedCountry}
      onChange={handleChange}
      placeholder="Select Country"
    />
  );
};
